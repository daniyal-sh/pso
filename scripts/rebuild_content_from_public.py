from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import fitz
from PIL import Image
from pypdf import PdfReader
from rapidocr_onnxruntime import RapidOCR


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
PUBLIC_DIR = ROOT / "public"
FIGURE_DIR = PUBLIC_DIR / "paper-assets"

SUBJECTS = ["Biology", "Chemistry", "Mathematics", "Physics"]
PART_I_SUBJECTS = {
    range(1, 6): "Biology",
    range(6, 11): "Chemistry",
    range(11, 16): "Mathematics",
    range(16, 21): "Physics",
}


def clean_text(text: str) -> str:
    replacements = {
        "\uf028": "(",
        "\uf029": ")",
        "\uf02d": "-",
        "\uf0b0": "°",
        "\uf0d7": "x",
        "ï¬": "fi",
        "ï¬‚": "fl",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"\b(?:Physics|Chemistry|Mathematics|Biology)\s+Page\s+\d+\s+of\s+\d+", " ", text, flags=re.I)
    text = re.sub(r"Name:_+\s*Roll No:_+", " ", text, flags=re.I)
    text = re.sub(r"\d{1,2}/\d{2}\s*\d{1,2}:\d{2}\s*CamScanner", " ", text, flags=re.I)
    text = re.sub(r"\n[ \t]+", "\n", text)
    return text


def compact(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def local_path(url: str | None) -> Path | None:
    if not url or url.startswith("http"):
        return None
    return PUBLIC_DIR / url.lstrip("/")


def pdf_text_pages(path: Path) -> list[str]:
    reader = PdfReader(str(path))
    return [clean_text(page.extract_text() or "") for page in reader.pages]


def fitz_text_pages(path: Path) -> list[str]:
    pages: list[str] = []
    with fitz.open(str(path)) as doc:
        for page in doc:
            blocks: list[tuple[float, float, str]] = []
            for block in page.get_text("blocks"):
                if len(block) < 5:
                    continue
                x0, y0, _x1, _y1, text, *_ = block
                if str(text).strip():
                    blocks.append((float(y0), float(x0), str(text)))
            blocks.sort(key=lambda item: (round(item[0], 1), round(item[1], 1)))
            pages.append(clean_text("\n".join(text for _, _, text in blocks)))
    return pages


def ocr_text_pages(page_images: list[str]) -> list[str]:
    ocr = RapidOCR()
    pages: list[str] = []
    for image_url in page_images:
        image_path = PUBLIC_DIR / image_url.lstrip("/")
        result, _ = ocr(str(image_path))
        lines = [str(item[1]) for item in (result or []) if item and len(item) >= 2]
        pages.append(clean_text("\n".join(lines)))
    return pages


def mark_question_numbers(text: str) -> str:
    def marker(match: re.Match[str]) -> str:
        raw = match.group(1).replace("I", "1").replace("l", "1")
        number = int(raw)
        if 1 <= number <= 99:
            return f"\n@@Q{number:02d}@@ "
        return match.group(0)

    text = re.sub(r"(?m)^\s*([1-9]\d?|I|l)(?:[\.),])?\s*$", marker, text)
    text = re.sub(r"(?m)^\s*([1-9]\d?|I|l)[\.),]\s+(?=\S)", marker, text)
    text = re.sub(r"(?m)^\s*([1-9]\d?)\s+(?=[A-Z](?:\s|[A-Za-z]))", marker, text)
    embedded_after_option = re.compile(
        r"((?:\(\s*d\s*\)|d\))\s+[^@]{1,180}?)(?<![A-Za-z0-9×x+\-–—−])([2-9]\d?)\s+(?=\S)",
        re.I,
    )

    def embedded_marker(match: re.Match[str]) -> str:
        number = int(match.group(2))
        if 2 <= number <= 99:
            return f"{match.group(1)}\n@@Q{number:02d}@@ "
        return match.group(0)

    # Some PDFs flatten two-column text so the next question starts after option d
    # on the same extracted line. Mark only those post-option starts to avoid
    # treating measurements/exponents inside question text as new questions.
    for _ in range(8):
        text, count = embedded_after_option.subn(embedded_marker, text)
        if not count:
            break
    return text


def page_text_with_markers(pages: list[str]) -> str:
    return "\n".join(f"\n@@PAGE{index + 1:02d}@@\n{page}" for index, page in enumerate(pages))


def actual_part_i_start(text: str) -> int:
    match = re.search(r"\[?CANDIDATE\s+MUST\s+ATTEMPT\s+THIS\s+PART\]?", text, re.I)
    if match:
        return match.start()
    match = re.search(r"PART\s*[-–—]?\s*I\s*\n?\s*\[?CANDIDATE", text, re.I)
    if match:
        return match.start()
    match = re.search(r"\bBIOLOGY\b[\s\S]{0,120}@@Q01@@", mark_question_numbers(text), re.I)
    return match.start() if match else 0


def part_iii_start(text: str, fallback: int) -> int:
    matches = list(re.finditer(r"(Part\s*III|PART\s*III|Descriptive Questions|Physics-Descriptive|Chemistry-Descriptive|Biology-Descriptive|Mathematics-Descriptive)", text, re.I))
    late = [match.start() for match in matches if match.start() > fallback]
    return late[-1] if late else len(text)


def split_sequence(marked: str, low: int, high: int) -> list[tuple[int, int, int]]:
    matches = list(re.finditer(r"@@Q(\d{2})@@", marked))
    expected = low
    items: list[tuple[int, int, int]] = []
    for index, match in enumerate(matches):
        number = int(match.group(1))
        if number != expected:
            continue
        end = len(marked)
        for later in matches[index + 1 :]:
            later_number = int(later.group(1))
            if later_number == expected + 1:
                end = later.start()
                break
        items.append((number, match.end(), end))
        expected += 1
        if expected > high:
            break
    return items


def split_numbered_candidates(marked: str, low: int, high: int) -> list[tuple[int, int, int]]:
    matches = list(re.finditer(r"@@Q(\d{2})@@", marked))
    items: list[tuple[int, int, int]] = []
    for index, match in enumerate(matches):
        number = int(match.group(1))
        if low <= number <= high:
            end = matches[index + 1].start() if index + 1 < len(matches) else len(marked)
            items.append((number, match.end(), end))
    return items


def question_page(marked: str, position: int) -> int | None:
    markers = list(re.finditer(r"@@PAGE(\d{2})@@", marked[:position]))
    if not markers:
        return None
    return int(markers[-1].group(1))


def strip_page_markers(text: str) -> str:
    return re.sub(r"@@PAGE\d{2}@@", " ", text)


def part_i_subject(number: int) -> str:
    for number_range, subject in PART_I_SUBJECTS.items():
        if number in number_range:
            return subject
    return "General"


def option_parts(body: str) -> tuple[str, list[str]]:
    normalized = compact(body)
    letter_map = {"𝑎": "a", "𝑏": "b", "𝑐": "c", "𝑑": "d"}
    pattern = re.compile(r"(?<![A-Za-z0-9])(?:\(\s*([a-dA-D𝑎𝑏𝑐𝑑])\s*\)|([a-dA-D𝑎𝑏𝑐𝑑])\))\s*")
    found: list[tuple[str, int, int]] = []
    expected = "a"
    for match in pattern.finditer(normalized):
        letter = letter_map.get(match.group(1) or match.group(2), (match.group(1) or match.group(2)).lower())
        if letter == expected:
            found.append((letter, match.start(), match.end()))
            expected = chr(ord(expected) + 1)
            if expected > "d":
                break
    if len(found) < 4:
        return normalized, []
    prompt = normalized[: found[0][1]].strip(" :")
    options: list[str] = []
    for index, (_, _, option_start) in enumerate(found):
        option_end = found[index + 1][1] if index + 1 < len(found) else len(normalized)
        option = normalized[option_start:option_end].strip(" ;,")
        options.append(option)
    return prompt, options[:4]


def descriptive_questions(text: str, paper: dict[str, Any]) -> list[dict[str, Any]]:
    segment = strip_page_markers(text)
    matches = list(re.finditer(r"Question\s+No\.?\s*(\d{1,2})\s*[:：]?", segment, re.I))
    if not matches:
        if compact(segment):
            matches = [re.search(r".", segment)]  # type: ignore[list-item]
        else:
            return []
    questions: list[dict[str, Any]] = []
    for index, match in enumerate(matches):
        number = int(match.group(1)) if match and match.lastindex else index + 1
        start = match.start() if match else 0
        end = matches[index + 1].start() if index + 1 < len(matches) else len(segment)
        body = compact(segment[start:end])
        body = re.sub(r"---End of paper---.*$", "", body, flags=re.I).strip()
        if len(body) < 40:
            continue
        questions.append(
            {
                "id": f"{paper['id']}-part-iii-{number}",
                "paperId": paper["id"],
                "paperSubject": paper["subject"],
                "number": 70 + number,
                "displayNumber": f"Descriptive {number}",
                "subject": paper["subject"],
                "topic": "Descriptive",
                "difficulty": "Descriptive",
                "type": "Long",
                "section": "Part III",
                "sectionTitle": "Descriptive Questions",
                "exam": paper["exam"],
                "year": paper["year"],
                "source": paper["title"],
                "prompt": body,
                "options": [],
                "answer": None,
                "solution": "",
                "page": None,
                "figure": "",
            }
        )
    return questions


def ocr_page_items(image_url: str) -> list[dict[str, Any]]:
    ocr = RapidOCR()
    image_path = PUBLIC_DIR / image_url.lstrip("/")
    result, _ = ocr(str(image_path))
    items: list[dict[str, Any]] = []
    for item in result or []:
        if not item or len(item) < 2:
            continue
        box = item[0]
        text = clean_text(str(item[1])).strip()
        if not text:
            continue
        x_values = [float(point[0]) for point in box]
        y_values = [float(point[1]) for point in box]
        x0, x1 = min(x_values), max(x_values)
        y0, y1 = min(y_values), max(y_values)
        items.append(
            {
                "text": text,
                "x0": x0,
                "x1": x1,
                "y0": y0,
                "y1": y1,
                "cx": (x0 + x1) / 2,
                "cy": (y0 + y1) / 2,
            }
        )
    return sorted(items, key=lambda item: (item["cy"], item["cx"]))


def question_start_number(text: str) -> int | None:
    normalized = re.sub(r"^\s*[Il|]", "1", text.strip())
    if re.fullmatch(r"\d{1,2}[\.)]?", normalized):
        normalized = normalized.rstrip(".)")
        number = int(normalized)
        if 1 <= number <= 70:
            return number
    match = re.match(r"^\s*(\d{1,2})[\.),](?!\d)\s*\S", normalized)
    if not match:
        match = re.match(r"^\s*(\d{1,2})(?=[A-Z][a-z])", normalized)
    if match:
        number = int(match.group(1))
        if 1 <= number <= 70:
            return number
    return None


def strip_leading_question_number(text: str, number: int) -> str:
    prefix = r"(?:1|I|l|\|)" if number == 1 else str(number)
    return re.sub(rf"^\s*{prefix}[\.),]?\s*", "", text.strip(), count=1)


def scanned_question_start_y(items: list[dict[str, Any]], number_item: dict[str, Any], width: int) -> float:
    nearby_text_rows = [
        float(item["y0"])
        for item in items
        if item["x0"] > width * 0.13
        and item["x1"] - item["x0"] > 240
        and number_item["y0"] - 36 <= item["y0"] <= number_item["y1"] + 24
        and not re.search(r"(?:\(\s*(?:[a-dA-D@8]|\s*)\)|\b[a-dA-D]\))", item["text"])
    ]
    return min([float(number_item["y0"]), *nearby_text_rows])


def option_column(item: dict[str, Any], width: int) -> int:
    cx = float(item["cx"])
    if cx < width * 0.29:
        return 0
    if cx < width * 0.49:
        return 1
    if cx < width * 0.69:
        return 2
    return 3


def split_scanned_option_text(text: str, fallback_column: int) -> list[tuple[int, str]]:
    cleaned = text.strip()
    cleaned = re.sub(r"^\((?:@|8)\)\s*", "(a) ", cleaned)
    if fallback_column >= 2:
        cleaned = re.sub(r"^\(\)\s*", "(c) ", cleaned)
    cleaned = re.sub(r"^\[\s*", "", cleaned)
    marker = re.compile(r"(?:\(\s*([a-dA-D𝑎𝑏𝑐𝑑@8])\s*\)|([a-dA-D@8])\))")
    matches = list(marker.finditer(cleaned))
    if not matches:
        if re.fullmatch(r"\(?[@8]?\)?", cleaned) or cleaned in {"()", "( )"}:
            return []
        return [(fallback_column, cleaned)]

    fragments: list[tuple[int, str]] = []
    letter_to_column = {"a": 0, "b": 1, "c": 2, "d": 3, "𝑎": 0, "𝑏": 1, "𝑐": 2, "𝑑": 3}
    if matches[0].start() > 0:
        prefix = cleaned[: matches[0].start()].strip()
        if prefix:
            fragments.append((fallback_column, prefix))
    for index, match in enumerate(matches):
        letter = (match.group(1) or match.group(2)).lower().replace("@", "a").replace("8", "a")
        column = letter_to_column.get(letter, fallback_column)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(cleaned)
        fragment = cleaned[match.end() : end].strip(" :;,.")
        if fragment:
            fragments.append((column, fragment))
    return fragments


def looks_like_scanned_option(text: str) -> bool:
    return bool(re.search(r"(?:\(\s*(?:[a-dA-D𝑎𝑏𝑐𝑑@8]|\s*)\)|[a-dA-D@8]\))", text))


def crop_scanned_figure(
    paper_id: str,
    page_image_url: str,
    page_number: int,
    question_number: int,
    start_y: float,
    option_y: float,
    width: int,
) -> str:
    image_path = PUBLIC_DIR / page_image_url.lstrip("/")
    out_dir = FIGURE_DIR / paper_id / "figures"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"q{question_number}-p{page_number}.webp"
    with Image.open(image_path) as image:
        image_width, image_height = image.size
        x0 = int(width * 0.58)
        x1 = int(width * 0.93)
        y0 = max(0, int(start_y - 16))
        y1 = min(image_height, int(option_y - 6))
        if y1 - y0 < 60:
            y1 = min(image_height, int(option_y + 60))
        image.crop((x0, y0, x1, y1)).save(out, "WEBP", quality=82, method=6)
    return "/" + out.relative_to(PUBLIC_DIR).as_posix()


def parse_scanned_paper(paper: dict[str, Any], pages: list[str]) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    for page_number, image_url in enumerate(paper.get("pageImages", []), 1):
        image_path = PUBLIC_DIR / image_url.lstrip("/")
        if not image_path.exists():
            continue
        with Image.open(image_path) as image:
            width, height = image.size
        items = [
            item
            for item in ocr_page_items(image_url)
            if item["y0"] > height * 0.08
            and item["y1"] < height * 0.84
            and "CamScanner" not in item["text"]
            and not re.fullmatch(r"(Name:?|Roll No:?|Page\s*\d+\s*of\s*\d+|Physics|Chemistry|Biology|Mathematics)", item["text"], re.I)
        ]
        starts: list[tuple[int, float, int]] = []
        for index, item in enumerate(items):
            number = question_start_number(item["text"])
            if number is not None and item["x0"] < width * 0.16:
                starts.append((number, scanned_question_start_y(items, item, width), index))
        starts.sort(key=lambda item: item[1])
        inferred_starts = list(starts)
        if starts and starts[0][0] > 1:
            leading_candidates = [
                item
                for item in items
                if item["y0"] < starts[0][1] - 18
                and item["x0"] > width * 0.11
                and item["x1"] - item["x0"] > 240
                and question_start_number(item["text"]) is None
                and not looks_like_scanned_option(item["text"])
            ]
            if leading_candidates:
                inferred_starts.append((starts[0][0] - 1, float(min(item["y0"] for item in leading_candidates)), -1))
        for start_index, (number, start_y, _item_index) in enumerate(starts):
            next_number = starts[start_index + 1][0] if start_index + 1 < len(starts) else None
            if next_number is None or next_number <= number + 1:
                continue
            end_y = starts[start_index + 1][1] - 4
            for item in items:
                if (
                    start_y + 45 <= item["y0"] < end_y - 18
                    and item["x0"] > width * 0.11
                    and item["x1"] - item["x0"] > 240
                    and question_start_number(item["text"]) is None
                    and not looks_like_scanned_option(item["text"])
                ):
                    inferred_starts.append((number + 1, float(item["y0"]), -1))
                    break
        starts = sorted(inferred_starts, key=lambda item: item[1])

        for start_index, (number, start_y, _item_index) in enumerate(starts):
            end_y = starts[start_index + 1][1] - 4 if start_index + 1 < len(starts) else height * 0.86
            group: list[dict[str, Any]] = []
            for item in items:
                if not (start_y - 6 <= item["y0"] < end_y) or item["x0"] <= width * 0.08:
                    continue
                copied = dict(item)
                if question_start_number(copied["text"]) == number:
                    copied["text"] = strip_leading_question_number(copied["text"], number)
                    copied["is_start"] = True
                    if not copied["text"]:
                        continue
                group.append(copied)
            if not group:
                continue

            option_candidates = [item["y0"] for item in group if item["cy"] > start_y + 18 and looks_like_scanned_option(item["text"])]
            if option_candidates:
                option_y = min(option_candidates)
            else:
                low_rows = sorted({round(item["y0"] / 8) * 8 for item in group if item["cy"] > start_y + 18})
                option_y = low_rows[-1] if low_rows else end_y

            prompt_items = [
                item
                for item in group
                if item["y0"] < option_y - 3 and (item.get("is_start") or item["x0"] > width * 0.13 or item["x1"] - item["x0"] > 240)
            ]
            option_items = [item for item in group if item["cy"] >= option_y - 3]
            prompt = compact(" ".join(item["text"] for item in sorted(prompt_items, key=lambda item: (item["cy"], item["cx"]))))
            option_columns = ["", "", "", ""]
            for item in sorted(option_items, key=lambda item: (item["cy"], item["cx"])):
                column = option_column(item, width)
                for target_column, fragment in split_scanned_option_text(item["text"], column):
                    if 0 <= target_column <= 3:
                        option_columns[target_column] = compact(f"{option_columns[target_column]} {fragment}")
            options = [re.sub(r"^\W+", "", option).strip() for option in option_columns]
            if len([option for option in options if option]) != 4 or len(prompt) < 2:
                continue

            section = "Part I" if number <= 20 else "Part II"
            subject = part_i_subject(number) if section == "Part I" else paper["subject"]
            figure = ""
            if re.search(r"\b(diagram|figure|graph|circuit|shown)\b", prompt, re.I):
                figure = crop_scanned_figure(paper["id"], image_url, page_number, number, start_y, option_y, width)
            questions.append(
                {
                    "id": f"{paper['id']}-{'part-i' if section == 'Part I' else 'part-ii'}-{number}",
                    "paperId": paper["id"],
                    "paperSubject": paper["subject"],
                    "number": number,
                    "displayNumber": str(number),
                    "subject": subject,
                    "topic": "Common MCQ" if section == "Part I" else f"{paper['subject']} MCQ",
                    "difficulty": "Screening" if section == "Part I" else "Subject MCQ",
                    "type": "MCQ",
                    "section": section,
                    "sectionTitle": "Common MCQs" if section == "Part I" else f"{paper['subject']} MCQs",
                    "exam": paper["exam"],
                    "year": paper["year"],
                    "source": paper["title"],
                    "prompt": prompt,
                    "options": options,
                    "answer": None,
                    "solution": "",
                    "page": page_number,
                    "figure": figure,
                }
            )

    joined = page_text_with_markers(pages)
    long_start = part_iii_start(joined, 0)
    questions.extend(descriptive_questions(joined[long_start:], paper))
    return merge_missing_mcqs([], questions)


def extract_image_figures(pdf_path: Path, paper_id: str, questions: list[dict[str, Any]]) -> dict[tuple[int, int], str]:
    figures: dict[tuple[int, int], str] = {}
    try:
        doc = fitz.open(str(pdf_path))
    except Exception:
        return figures

    questions_by_page: dict[int, list[int]] = {}
    for question in questions:
        page = question.get("page")
        if isinstance(page, int) and question["type"] == "MCQ":
            questions_by_page.setdefault(page, []).append(int(question["number"]))

    for page_number, numbers in questions_by_page.items():
        page = doc[page_number - 1]
        starts: list[tuple[int, float]] = []
        for block in page.get_text("dict").get("blocks", []):
            if block.get("type") != 0:
                continue
            text = "\n".join("".join(span.get("text", "") for span in line.get("spans", [])) for line in block.get("lines", []))
            match = re.match(r"\s*(\d{1,2})(?:[\.)])?\s*(?:$|\S)", text)
            if match:
                number = int(match.group(1))
                if number in numbers:
                    starts.append((number, float(block["bbox"][1])))
        starts.sort(key=lambda item: item[1])
        image_blocks = [
            block
            for block in page.get_text("dict").get("blocks", [])
            if block.get("type") == 1 and block["bbox"][1] > 130 and (block["bbox"][2] - block["bbox"][0]) < 250
        ]
        for image_index, block in enumerate(image_blocks, 1):
            image_y = float(block["bbox"][1])
            owner = None
            for number, y in starts:
                if y <= image_y:
                    owner = number
                else:
                    break
            if owner is None:
                continue
            out_dir = FIGURE_DIR / paper_id / "figures"
            out_dir.mkdir(parents=True, exist_ok=True)
            out = out_dir / f"q{owner}-p{page_number}-{image_index}.webp"
            if not out.exists():
                rect = fitz.Rect(block["bbox"])
                rect.x0 = max(0, rect.x0 - 12)
                rect.y0 = max(0, rect.y0 - 12)
                rect.x1 = min(page.rect.width, rect.x1 + 12)
                rect.y1 = min(page.rect.height, rect.y1 + 12)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=rect, alpha=False)
                pix.save(str(out.with_suffix(".png")))
                with Image.open(out.with_suffix(".png")) as image:
                    image.save(out, "WEBP", quality=82, method=6)
                out.with_suffix(".png").unlink(missing_ok=True)
            figures[(page_number, owner)] = "/" + out.relative_to(PUBLIC_DIR).as_posix()
    return figures


def parse_paper_pages(paper: dict[str, Any], pages: list[str], pdf_path: Path) -> list[dict[str, Any]]:
    joined = page_text_with_markers(pages)
    start = actual_part_i_start(joined)
    marked = mark_question_numbers(joined[start:])
    q21 = re.search(r"@@Q21@@", marked)
    if not q21:
        return []
    part_i = marked[: q21.start()]
    part_i = re.sub(r"(?m)^\s*OR\s+COMPUTER[\s\S]*?(?=\bCHEMISTRY\b|@@Q06@@)", " ", part_i, flags=re.I)
    part_ii = marked[q21.start() :]

    questions: list[dict[str, Any]] = []
    accepted_part_i: set[int] = set()
    part_i_items = split_sequence(part_i, 1, 20) + split_numbered_candidates(part_i, 1, 20)
    for number, start_pos, end_pos in part_i_items:
        if number in accepted_part_i:
            continue
        body = strip_page_markers(part_i[start_pos:end_pos])
        prompt, options = option_parts(body)
        if len(options) != 4 or len(prompt) < 2:
            continue
        accepted_part_i.add(number)
        page = question_page(part_i, start_pos)
        subject = part_i_subject(number)
        questions.append(
            {
                "id": f"{paper['id']}-part-i-{number}",
                "paperId": paper["id"],
                "paperSubject": paper["subject"],
                "number": number,
                "displayNumber": str(number),
                "subject": subject,
                "topic": "Common MCQ",
                "difficulty": "Screening",
                "type": "MCQ",
                "section": "Part I",
                "sectionTitle": "Common MCQs",
                "exam": paper["exam"],
                "year": paper["year"],
                "source": paper["title"],
                "prompt": prompt,
                "options": options,
                "answer": None,
                "solution": "",
                "page": page,
                "figure": "",
            }
        )

    part_ii_items = split_sequence(part_ii, 21, 70) + split_numbered_candidates(part_ii, 21, 70)
    part_iii = marked[part_iii_start(marked, q21.start()) :]

    accepted_part_ii: set[int] = set()
    for number, start_pos, end_pos in part_ii_items:
        if number in accepted_part_ii:
            continue
        body = strip_page_markers(part_ii[start_pos:end_pos])
        prompt, options = option_parts(body)
        if len(options) != 4 or len(prompt) < 2:
            continue
        accepted_part_ii.add(number)
        page = question_page(part_ii, start_pos)
        questions.append(
            {
                "id": f"{paper['id']}-part-ii-{number}",
                "paperId": paper["id"],
                "paperSubject": paper["subject"],
                "number": number,
                "displayNumber": str(number),
                "subject": paper["subject"],
                "topic": f"{paper['subject']} MCQ",
                "difficulty": "Subject MCQ",
                "type": "MCQ",
                "section": "Part II",
                "sectionTitle": f"{paper['subject']} MCQs",
                "exam": paper["exam"],
                "year": paper["year"],
                "source": paper["title"],
                "prompt": prompt,
                "options": options,
                "answer": None,
                "solution": "",
                "page": page,
                "figure": "",
            }
        )

    figures = extract_image_figures(pdf_path, paper["id"], questions)
    for question in questions:
        page = question.get("page")
        figure = figures.get((page, question["number"])) if isinstance(page, int) else None
        if figure:
            question["figure"] = figure

    questions.extend(descriptive_questions(part_iii, paper))
    return questions


def merge_missing_mcqs(primary: list[dict[str, Any]], alternate: list[dict[str, Any]]) -> list[dict[str, Any]]:
    used_numbers = {question["number"] for question in primary if question["type"] == "MCQ" and 1 <= question["number"] <= 70}
    merged = list(primary)
    for question in alternate:
        number = question.get("number")
        if question.get("type") != "MCQ" or not isinstance(number, int) or number in used_numbers:
            continue
        if 1 <= number <= 70 and len(question.get("options", [])) == 4 and len(question.get("prompt", "")) >= 2:
            merged.append(question)
            used_numbers.add(number)
    merged.sort(key=lambda q: (q.get("section", ""), q["number"]))
    return merged


def parse_paper(paper: dict[str, Any]) -> list[dict[str, Any]]:
    pdf_path = local_path(paper.get("resourceUrl"))
    if not pdf_path or not pdf_path.exists():
        return []
    pages = pdf_text_pages(pdf_path)
    scanned = bool(paper.get("scanned")) or sum(len(page.strip()) for page in pages) < 1000
    if scanned:
        pages = ocr_text_pages(paper.get("pageImages", []))
        return parse_scanned_paper(paper, pages)

    questions = parse_paper_pages(paper, pages, pdf_path)
    if not scanned and sum(1 for question in questions if question["type"] == "MCQ") < 70:
        alternate = parse_paper_pages(paper, fitz_text_pages(pdf_path), pdf_path)
        questions = merge_missing_mcqs(questions, alternate)
    return questions


def ensure_unique_ids(questions: list[dict[str, Any]]) -> None:
    seen: dict[str, int] = {}
    for question in questions:
        base = question["id"]
        seen[base] = seen.get(base, 0) + 1
        if seen[base] > 1:
            question["id"] = f"{base}-{seen[base]}"


def main() -> None:
    past_papers = json.loads((DATA_DIR / "past-papers.json").read_text(encoding="utf-8"))
    existing_questions = json.loads((DATA_DIR / "questions.json").read_text(encoding="utf-8"))
    problem_set_questions = [question for question in existing_questions if not question.get("paperId")]

    all_questions: list[dict[str, Any]] = []
    for paper in past_papers:
        paper_questions = parse_paper(paper)
        mcqs = [question for question in paper_questions if question["type"] == "MCQ"]
        long = [question for question in paper_questions if question["type"] == "Long"]
        paper["questionCount"] = len(paper_questions)
        paper["mcqCount"] = len(mcqs)
        paper["descriptiveCount"] = len(long)
        paper["partICount"] = sum(1 for question in paper_questions if question.get("section") == "Part I")
        paper["partIICount"] = sum(1 for question in paper_questions if question.get("section") == "Part II")
        all_questions.extend(paper_questions)

    for question in problem_set_questions:
        question.setdefault("paperSubject", "")
        question.setdefault("displayNumber", str(question.get("number", "")))
        question.setdefault("section", "Resource")
        question.setdefault("sectionTitle", "Problem Set")
    all_questions.extend(problem_set_questions)
    ensure_unique_ids(all_questions)
    all_questions.sort(key=lambda q: (q.get("paperSubject") or q["subject"], q["year"], q["source"], q.get("section", ""), q["number"]))
    past_papers.sort(key=lambda paper: (paper["year"], paper["subject"]))

    (DATA_DIR / "past-papers.json").write_text(json.dumps(past_papers, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (DATA_DIR / "questions.json").write_text(json.dumps(all_questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    summary = {
        "papers": len(past_papers),
        "questions": len(all_questions),
        "paper_questions": len(all_questions) - len(problem_set_questions),
        "mcq": sum(1 for question in all_questions if question["type"] == "MCQ"),
        "long": sum(1 for question in all_questions if question["type"] == "Long"),
        "incomplete_mcq_options": sum(1 for question in all_questions if question["type"] == "MCQ" and len(question["options"]) != 4),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
