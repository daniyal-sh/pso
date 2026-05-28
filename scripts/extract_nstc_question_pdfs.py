from __future__ import annotations

import argparse
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import fitz


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "output" / "pdf" / "nstc-question-crops"
PAST_PAPERS_JSON = ROOT / "src" / "data" / "past-papers.json"
QUESTIONS_JSON = ROOT / "src" / "data" / "questions.json"


@dataclass(frozen=True)
class Start:
    number: int
    page_index: int
    y: float
    x: float
    token: str
    text: str

    @property
    def pos(self) -> tuple[int, float]:
        return (self.page_index, self.y)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def safe_filename(value: str, max_len: int = 150) -> str:
    value = re.sub(r"[^A-Za-z0-9._ -]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return (value or "untitled")[:max_len].rstrip(" .")


def local_pdf_path(resource_url: str | None) -> Path | None:
    if not resource_url:
        return None
    if not resource_url.startswith("/"):
        return None
    return ROOT / "public" / resource_url.lstrip("/")


def line_words(page: fitz.Page) -> list[list[tuple]]:
    words = page.get_text("words")
    groups: dict[tuple[int, int], list[tuple]] = {}
    for word in words:
        block = int(word[5]) if len(word) > 5 else 0
        line = int(word[6]) if len(word) > 6 else round(float(word[1]) / 3)
        groups.setdefault((block, line), []).append(word)
    rows = []
    for _key, row in sorted(groups.items(), key=lambda item: (item[0][0], item[0][1])):
        rows.append(sorted(row, key=lambda word: float(word[0])))
    return rows


def line_text(words: list[tuple]) -> str:
    return " ".join(str(word[4]).strip() for word in words if str(word[4]).strip())


def find_question_starts(doc: fitz.Document) -> list[Start]:
    starts: list[Start] = []
    seen: set[tuple[int, int, int]] = set()
    for page_index in range(doc.page_count):
        page = doc[page_index]
        for words in line_words(page):
            if not words:
                continue
            x0 = float(words[0][0])
            if x0 > 105:
                continue
            token = str(words[0][4]).strip()
            if (
                len(words) >= 2
                and re.fullmatch(r"\d", token)
                and re.fullmatch(r"\d", str(words[1][4]).strip())
                and abs(float(words[1][0]) - float(words[0][2])) < 16
            ):
                token = f"{token}{str(words[1][4]).strip()}"
            match = re.fullmatch(r"(\d{1,2})(?:[.)])?", token)
            if not match:
                continue
            number = int(match.group(1))
            if not 1 <= number <= 99:
                continue
            y0 = float(words[0][1])
            if y0 > page.rect.height - 54:
                continue
            text = line_text(words)
            lowered = text.lower()
            if any(skip in lowered for skip in ["page ", "phone:", "e-mail", "roll no", "name:"]):
                continue
            key = (page_index, round(y0), number)
            if key in seen:
                continue
            seen.add(key)
            starts.append(Start(number=number, page_index=page_index, y=y0, x=x0, token=token, text=text))
    return sorted(starts, key=lambda start: (start.page_index, start.y, start.x))


def find_descriptive_starts(doc: fitz.Document, marker: tuple[int, float] | None) -> list[Start]:
    if not marker:
        return []
    starts: list[Start] = []
    seen: set[tuple[int, int, int]] = set()
    pattern = re.compile(r"^Question\s*(?:No\.?\s*)?0*(\d{1,2})\s*[:.)]?", re.IGNORECASE)
    for page_index in range(marker[0], doc.page_count):
        page = doc[page_index]
        for words in line_words(page):
            if not words:
                continue
            y0 = float(words[0][1])
            if (page_index, y0) <= marker:
                continue
            text = line_text(words)
            match = pattern.search(text.strip())
            if not match:
                continue
            number = int(match.group(1))
            key = (page_index, round(y0), number)
            if key in seen:
                continue
            seen.add(key)
            starts.append(Start(number=number, page_index=page_index, y=y0, x=float(words[0][0]), token=match.group(0), text=text))
    return sorted(starts, key=lambda start: (start.page_index, start.y, start.x))


def find_section_marker(doc: fitz.Document, pattern: str) -> tuple[int, float] | None:
    markers = find_section_markers(doc, pattern)
    return markers[0] if markers else None


def find_section_markers(doc: fitz.Document, pattern: str) -> list[tuple[int, float]]:
    regex = re.compile(pattern, re.IGNORECASE)
    markers: list[tuple[int, float]] = []
    for page_index in range(doc.page_count):
        page = doc[page_index]
        for words in line_words(page):
            text = line_text(words)
            if regex.search(text.strip()):
                markers.append((page_index, float(words[0][1])))
    return markers


def starts_after(starts: list[Start], pos: tuple[int, float]) -> list[Start]:
    page, y = pos
    return [start for start in starts if (start.page_index, start.y) > (page, y)]


def choose_start(candidates: list[Start], number: int, after: tuple[int, float]) -> Start | None:
    usable = [start for start in candidates if start.number == number and start.pos > after]
    return usable[0] if usable else None


def comparable_words(value: str) -> set[str]:
    value = re.sub(r"^Question\s*(?:No\.?\s*)?0*\d+\s*[:.)]?", " ", value, flags=re.IGNORECASE)
    return {word for word in re.findall(r"[a-z0-9]{4,}", value.lower()) if word not in {"question", "which", "what", "does", "from", "with"}}


def choose_descriptive_start(candidates: list[Start], question: dict[str, Any], after: tuple[int, float]) -> Start | None:
    number = int(question["number"])
    display_match = re.search(r"Descriptive\s+(\d{1,2})", str(question.get("displayNumber", "")), re.IGNORECASE)
    if display_match:
        number = int(display_match.group(1))
    usable = [start for start in candidates if start.number == number and start.pos > after]
    if not usable:
        return None
    prompt_words = comparable_words(str(question.get("prompt", "")))
    if not prompt_words:
        return usable[0]
    return max(usable, key=lambda start: len(prompt_words & comparable_words(start.text)))


def next_boundary(starts: list[Start], current: Start, *, section_limit: tuple[int, float] | None = None) -> tuple[int, float] | None:
    boundaries = [start.pos for start in starts if start.pos > current.pos]
    if section_limit and section_limit > current.pos:
        boundaries.append(section_limit)
    return min(boundaries) if boundaries else section_limit


def clip_for_segment(doc: fitz.Document, start: Start, end: tuple[int, float] | None) -> list[dict[str, float | int]]:
    end_page = end[0] if end else doc.page_count - 1
    segments: list[dict[str, float | int]] = []
    for page_index in range(start.page_index, end_page + 1):
        page = doc[page_index]
        y0 = start.y - 7 if page_index == start.page_index else 40.0
        if end and page_index == end[0]:
            y1 = end[1] - 12
            if y1 <= y0 + 8:
                y1 = end[1] - 3
        else:
            y1 = page.rect.height - 36
        y0 = max(0.0, y0)
        y1 = min(float(page.rect.height), y1)
        if y1 <= y0 + 8:
            continue
        segments.append(
            {
                "page": page_index + 1,
                "x0": 18.0,
                "y0": float(y0),
                "x1": float(page.rect.width - 18),
                "y1": float(y1),
            }
        )
    return segments


def segment_rect(segment: dict[str, Any]) -> fitz.Rect:
    return fitz.Rect(float(segment["x0"]), float(segment["y0"]), float(segment["x1"]), float(segment["y1"]))


def write_crop_pdf(source_pdf: Path, segments: list[dict[str, float | int]], output_pdf: Path) -> bool:
    source = fitz.open(source_pdf)
    out = fitz.open()
    try:
        for segment in segments:
            source_page_index = int(segment["page"]) - 1
            rect = segment_rect(segment)
            if rect.is_empty or rect.is_infinite or rect.width <= 1 or rect.height <= 1:
                continue
            page = out.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(page.rect, source, source_page_index, clip=rect)
        if not out.page_count:
            return False
        output_pdf.parent.mkdir(parents=True, exist_ok=True)
        out.save(output_pdf, garbage=4, deflate=True)
        return True
    finally:
        out.close()
        source.close()


def extract_paper(paper: dict[str, Any], questions: list[dict[str, Any]], output_root: Path, *, write_crops: bool) -> dict[str, Any]:
    pdf_path = local_pdf_path(paper.get("resourceUrl"))
    result: dict[str, Any] = {
        "paperId": paper["id"],
        "title": paper["title"],
        "subject": paper["subject"],
        "year": paper["year"],
        "sourcePdf": str(pdf_path) if pdf_path else "",
        "questions": [],
        "diagnostics": [],
    }
    if not pdf_path or not pdf_path.exists():
        result["diagnostics"].append("missing_source_pdf")
        return result

    doc = fitz.open(pdf_path)
    try:
        starts = find_question_starts(doc)
        part_i_marker = find_section_marker(doc, r"^PART[-\s]*I\s*$")
        part_iii_candidates = find_section_markers(doc, r"^PART[-\s]*III\b")
        part_iii_marker = next((marker for marker in part_iii_candidates if not part_i_marker or marker > part_i_marker), None)
        mcq_pool = starts_after(starts, part_i_marker or (0, 0.0))
        if part_iii_marker:
            mcq_pool = [start for start in mcq_pool if start.pos < part_iii_marker]
        desc_pool = find_descriptive_starts(doc, part_iii_marker)

        last_mcq_pos = (part_i_marker or (0, 0.0))
        last_desc_pos = (part_iii_marker or (0, 0.0))
        for question in questions:
            is_descriptive = question.get("section") == "Part III" or question.get("type") == "Long"
            pool = desc_pool if is_descriptive else mcq_pool
            after = last_desc_pos if is_descriptive else last_mcq_pos
            start = choose_descriptive_start(pool, question, after) if is_descriptive else choose_start(pool, int(question["number"]), after)
            if not start:
                result["diagnostics"].append(f"{question['id']}: missing_start")
                continue
            boundary_pool = desc_pool if is_descriptive else mcq_pool
            section_limit = None if is_descriptive else part_iii_marker
            end = next_boundary(boundary_pool, start, section_limit=section_limit)
            segments = clip_for_segment(doc, start, end)
            rel_output = Path(str(paper["year"])) / paper["subject"].lower() / safe_filename(paper["id"]) / f"{safe_filename(question['id'])}.pdf"
            abs_output = output_root / "questions" / rel_output
            wrote = write_crop_pdf(pdf_path, segments, abs_output) if write_crops else False
            if is_descriptive:
                last_desc_pos = start.pos
            else:
                last_mcq_pos = start.pos
            result["questions"].append(
                {
                    "id": question["id"],
                    "paperId": paper["id"],
                    "subject": question["subject"],
                    "year": question["year"],
                    "section": question["section"],
                    "type": question["type"],
                    "number": question["number"],
                    "displayNumber": question["displayNumber"],
                    "sourcePdf": str(pdf_path),
                    "cropPdf": str(abs_output) if write_crops and wrote else "",
                    "cropPath": str(Path("questions") / rel_output).replace("\\", "/") if write_crops and wrote else "",
                    "segments": segments,
                    "startText": start.text,
                }
            )
    finally:
        doc.close()
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract original-PDF NSTC question crops for 2022-2024 papers.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--clean", action="store_true", help="Remove the output directory before writing.")
    parser.add_argument("--no-write-crops", action="store_true", help="Only write manifest metadata.")
    args = parser.parse_args()

    output_root = args.output.resolve()
    if args.clean and output_root.exists():
        shutil.rmtree(output_root)

    papers = [paper for paper in read_json(PAST_PAPERS_JSON) if int(paper["year"]) < 2025 and paper.get("resourceUrl")]
    all_questions = [question for question in read_json(QUESTIONS_JSON) if int(question.get("year") or 0) < 2025 and question.get("paperId")]
    by_paper: dict[str, list[dict[str, Any]]] = {}
    for question in all_questions:
        by_paper.setdefault(question["paperId"], []).append(question)
    for rows in by_paper.values():
        rows.sort(key=lambda row: (row.get("section") == "Part III", row["number"], row["id"]))

    paper_results = []
    for paper in sorted(papers, key=lambda row: (row["year"], row["subject"])):
        result = extract_paper(paper, by_paper.get(paper["id"], []), output_root, write_crops=not args.no_write_crops)
        paper_results.append(result)
        print(f"{paper['title']}: {len(result['questions'])}/{len(by_paper.get(paper['id'], []))} crops, diagnostics={len(result['diagnostics'])}")

    records = [question for paper in paper_results for question in paper["questions"]]
    manifest = {
        "version": 1,
        "pipeline": "nstc_question_pdf_extractor",
        "artifactPolicy": "question bodies are original PDF crops from repository NSTC PDFs; 2025 camera-scan papers are excluded",
        "counts": {
            "papers": len(paper_results),
            "questionsExpected": sum(len(by_paper.get(paper["id"], [])) for paper in papers),
            "questionsExtracted": len(records),
            "writtenPdfs": sum(1 for record in records if record.get("cropPdf")),
            "diagnostics": sum(len(paper["diagnostics"]) for paper in paper_results),
        },
        "papers": paper_results,
    }
    write_json(output_root / "manifest.json", manifest)
    print(f"Wrote manifest: {output_root / 'manifest.json'}")


if __name__ == "__main__":
    main()
