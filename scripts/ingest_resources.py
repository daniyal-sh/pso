from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

from PIL import Image
from pypdf import PdfReader
from rapidocr_onnxruntime import RapidOCR


"""
Legacy local-resource importer.

Production resources are now uploaded from the admin dashboard into Supabase
Storage and saved in the resources table. This script is kept only for
provenance/re-ingestion work and should not be used as the normal resource
publishing path.
"""

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / ".tmp" / "resource-ingest"
DRIVE = TMP / "drive"
PUBLIC_RESOURCES = ROOT / "public" / "resources"
PUBLIC_PAPER_ASSETS = ROOT / "public" / "paper-assets"
DATA_DIR = ROOT / "src" / "data"
GUIDES_DIR = ROOT / "content" / "guides"

SOURCE_FOLDERS = {
    "past-papers-1": "https://drive.google.com/drive/folders/1t-bQK0E98jY05WUnChDpNrQViLCCyl7y?usp=sharing",
    "past-papers-2": "https://drive.google.com/drive/folders/1Uhr1injsmQdYBDQxjXtSllmpXWHmSg1g?usp=sharing",
    "past-papers-3": "https://drive.google.com/drive/folders/1tDxea2rfUeodaWQ0IgImym13lHpjY4iM?usp=sharing",
    "past-papers-4": "https://drive.google.com/drive/folders/1T02_pXQ70z14tS6kSMMcXJ1wHttZEKtz?usp=sharing",
    "ioaa": "https://drive.google.com/drive/u/4/folders/127apYXEV79djdzNW1qZeFALBD_1Jo780?usp=sharing",
    "math-problem-sets": "https://drive.google.com/drive/folders/15RF3CFO6wea2UIp9vBrmeKWh083cgAep?usp=sharing",
    "physics-1": "https://drive.google.com/drive/u/4/folders/10h6RwSopzdbV2UviovnaimqmlgZ9SJNc",
    "physics-2": "https://drive.google.com/drive/folders/1SiPFWQfwrTkBIA6WmE6Mua9g3SDoJ1nV",
    "chemistry": "https://drive.google.com/drive/folders/1sCxZnxY9KuXTyEEzchQ6v0Pl6JKsXumu",
    "biology": "https://drive.google.com/drive/folders/1745To0zPDw1Pb4KiBGzjIZxO0Z7UFzTk",
}

SUBJECT_ALIASES = {
    "maths": "Mathematics",
    "math": "Mathematics",
    "mathematics": "Mathematics",
    "physics": "Physics",
    "chemistry": "Chemistry",
    "bio": "Biology",
    "biology": "Biology",
    "astronomy": "Astronomy",
    "ioaa": "Astronomy",
    "informatics": "Informatics",
    "computer": "Informatics",
}


def slugify(value: str) -> str:
    value = value.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def pdf_pages(path: Path) -> int:
    try:
        return len(PdfReader(str(path)).pages)
    except Exception:
        return 0


def pdf_text_by_page(path: Path) -> list[str]:
    try:
        reader = PdfReader(str(path))
        return [(page.extract_text() or "").strip() for page in reader.pages]
    except Exception:
        return []


def ensure_unique_question_ids(questions: list[dict[str, Any]]) -> None:
    seen: dict[str, int] = {}
    for question in questions:
        base_id = str(question["id"])
        seen[base_id] = seen.get(base_id, 0) + 1
        if seen[base_id] > 1:
            question["id"] = f"{base_id}-{seen[base_id]}"


def infer_subject(path: Path) -> str:
    text = str(path).lower()
    for key, subject in SUBJECT_ALIASES.items():
        if key in text:
            return subject
    return "General"


def infer_kind(path: Path) -> str:
    text = str(path).lower()
    if "past-paper" in text or "final-" in text or "nstc" in text or path.parent.name.startswith("past-papers"):
        return "Past Paper"
    if "solution" in text:
        return "Solution"
    if "problem" in text or "q" in path.stem.lower():
        return "Problem Set"
    if "chapter" in text or "textbook" in text or "book" in text:
        return "Book"
    if "guide" in text or "tutorial" in text or "handout" in text:
        return "Guide"
    return "Resource"


def infer_year(path: Path) -> int | None:
    match = re.search(r"(20\d{2})", path.name)
    if match:
        return int(match.group(1))
    if "past-papers-4" in str(path):
        return 2025
    return None


def copy_resource(path: Path, category: str, max_bytes: int = 16_000_000) -> str | None:
    if path.stat().st_size > max_bytes:
        return None
    target_dir = PUBLIC_RESOURCES / slugify(category)
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{slugify(path.stem)}{path.suffix.lower()}"
    if not target.exists():
        shutil.copy2(path, target)
    return "/" + target.relative_to(ROOT / "public").as_posix()


def render_pdf_pages(path: Path, paper_id: str) -> list[str]:
    out_dir = PUBLIC_PAPER_ASSETS / paper_id
    out_dir.mkdir(parents=True, exist_ok=True)
    images: list[str] = []
    page_count = pdf_pages(path)
    for idx in range(page_count):
        out = out_dir / f"page-{idx + 1}.webp"
        if not out.exists():
            prefix = TMP / "render" / f"{paper_id}-page-{idx + 1}"
            prefix.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [
                    "pdftoppm",
                    "-png",
                    "-r",
                    "130",
                    "-f",
                    str(idx + 1),
                    "-l",
                    str(idx + 1),
                    "-singlefile",
                    str(path),
                    str(prefix),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            png = Path(str(prefix) + ".png")
            with Image.open(png) as image:
                image.thumbnail((1280, 1800))
                image.save(out, "WEBP", quality=72, method=6)
            png.unlink(missing_ok=True)
        images.append("/" + out.relative_to(ROOT / "public").as_posix())
    return images


def extract_options(text: str) -> list[str]:
    compact = re.sub(r"\s+", " ", text).strip()
    matches = list(re.finditer(r"(?:^|\s)([a-dA-D])[\)\.]\s+", compact))
    if len(matches) < 2:
        return []
    options: list[str] = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(compact)
        option = compact[start:end].strip()
        option = re.sub(r"\s+", " ", option)
        if option:
            options.append(option[:280])
    return options[:4]


def clean_question_text(text: str) -> str:
    text = re.sub(r"\n\s*(Physics|Chemistry|Mathematics|Biology)\s+Page\s+\d+\s+of\s+\d+\s*", "\n", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    return text


def split_numbered_questions(text_by_page: list[str], paper: dict[str, Any], page_images: list[str]) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    for page_index, page_text in enumerate(text_by_page):
        if page_index == 0 and "check list" in page_text.lower():
            continue
        pattern = re.compile(r"(?m)^\s*(\d{1,3})[\.\)]\s+")
        matches = list(pattern.finditer(page_text))
        for idx, match in enumerate(matches):
            number = int(match.group(1))
            start = match.end()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(page_text)
            body = clean_question_text(page_text[start:end])
            if len(body) < 20:
                continue
            options = extract_options(body)
            qtype = "MCQ" if len(options) >= 2 else "Long"
            questions.append(
                {
                    "id": f"{paper['id']}-q{number}",
                    "paperId": paper["id"],
                    "number": number,
                    "subject": paper["subject"],
                    "topic": "Past Paper",
                    "difficulty": "Screening" if number <= 70 else "Descriptive",
                    "type": qtype,
                    "exam": paper["exam"],
                    "year": paper["year"],
                    "source": paper["title"],
                    "prompt": body[:4000],
                    "options": options,
                    "answer": None,
                    "solution": "",
                    "page": page_index + 1,
                    "figure": page_images[page_index] if page_index < len(page_images) else "",
                }
            )
    return questions


def ocr_scanned_paper(path: Path, paper: dict[str, Any], page_images: list[str]) -> list[dict[str, Any]]:
    ocr = RapidOCR()
    questions: list[dict[str, Any]] = []
    for page_index, image_url in enumerate(page_images):
        image_path = ROOT / "public" / image_url.lstrip("/")
        result, _ = ocr(str(image_path))
        lines = [item[1] for item in (result or []) if item and len(item) >= 2]
        text = "\n".join(lines)
        if page_index == 0 and "CamScanner" in text:
            continue
        page_questions = split_numbered_questions([text], paper, [image_url])
        for q in page_questions:
            q["id"] = f"{paper['id']}-ocr-p{page_index + 1}-q{q['number']}"
            q["page"] = page_index + 1
            q["figure"] = image_url
        questions.extend(page_questions)
    return questions


def extract_math_problem_set(path: Path, resource_id: str, resource_title: str) -> list[dict[str, Any]]:
    pages = pdf_text_by_page(path)
    text = "\n".join(pages)
    parts = re.split(r"(?=Problem\s+\d+[:.])", text)
    questions: list[dict[str, Any]] = []
    for part in parts:
        match = re.search(r"Problem\s+(\d+)[:.]\s*([^\n]+)?", part)
        if not match:
            continue
        number = int(match.group(1))
        prompt = clean_question_text(part)
        if len(prompt) < 30:
            continue
        questions.append(
            {
                "id": f"{resource_id}-problem-{number}",
                "paperId": "",
                "number": number,
                "subject": "Mathematics",
                "topic": match.group(2).strip() if match.group(2) else "Problem Set",
                "difficulty": "Olympiad",
                "type": "Long",
                "exam": "NMTC",
                "year": infer_year(path) or 2026,
                "source": resource_title,
                "prompt": prompt[:4000],
                "options": [],
                "answer": None,
                "solution": "",
                "page": None,
                "figure": "",
            }
        )
    return questions


def notion_plain_text(rich: list[Any] | None) -> str:
    if not rich:
        return ""
    return "".join(str(item[0]) for item in rich if item)


def notion_to_mdx() -> None:
    source = TMP / "notion-loadPageChunk.json"
    if not source.exists():
        return
    data = json.loads(source.read_text(encoding="utf-8"))
    blocks = data["recordMap"]["block"]
    page = blocks["21a54621-1753-80bb-b45a-c694434467b3"]["value"]["value"]
    lines: list[str] = []
    resources: list[str] = []
    for block_id in page.get("content", []):
        block = blocks.get(block_id, {}).get("value", {}).get("value")
        if not block:
            continue
        title = notion_plain_text(block.get("properties", {}).get("title"))
        if not title.strip():
            continue
        btype = block.get("type")
        if btype == "text" and title.strip().lower() in {"selection process", "preparation guide", "why should i do ioaa?", "resources"}:
            lines.append(f"\n## {title.strip()}\n")
        elif btype == "numbered_list":
            lines.append(f"1. {title.strip()}")
        elif btype == "bulleted_list":
            lines.append(f"- {title.strip()}")
        else:
            lines.append(title.strip())
        rich = block.get("properties", {}).get("title") or []
        for chunk in rich:
            if len(chunk) > 1:
                for mark in chunk[1]:
                    if mark and mark[0] == "a":
                        resources.append(f"- [{chunk[0]}]({mark[1]})")
    if resources:
        lines.append("\n## Linked Resources\n")
        lines.extend(sorted(set(resources)))
    body = "\n\n".join(lines)
    mdx = f"""---
title: IOAA Pakistan Guide
description: A comprehensive Pakistan-specific guide to IOAA eligibility, selection rounds, preparation, resources, and motivation.
category: Astronomy
level: Advanced
readTime: 18 min
author: Daniyal Shahzad
updated: 2026-05-06
sourceUrl: https://husky-guan-e1d.notion.site/IOAA-Pakistan-Guide-21a54621175380bbb45ac694434467b3
tags: [Astronomy, IOAA, Pakistan, Selection, Roadmap]
featured: true
---

{body}
"""
    (GUIDES_DIR / "ioaa-pakistan-guide.mdx").write_text(mdx, encoding="utf-8")


def build_guides_from_sources() -> None:
    guides = {
        "nstc-selection-and-screening-guide": {
            "title": "NSTC Selection and Screening Guide",
            "category": "NSTC",
            "level": "Beginner",
            "readTime": "16 min",
            "source": SOURCE_FOLDERS["past-papers-1"],
            "body": """
## What NSTC Screening Looks Like

NSTC screening papers combine a shared Part I with subject-specific Part II and descriptive work. The downloaded papers from 2022-2025 show a consistent pattern: broad science MCQs first, then deeper subject questions.

## How To Prepare

1. Read one complete paper before solving so you understand timing and sections.
1. Build accuracy on Part I first; it is broad but very learnable.
1. Move to your subject-specific Part II with timed sets.
1. Treat descriptive questions as proof of understanding, not formula recall.

## Practice Plan

- Week 1: solve one paper untimed and build an error log.
- Week 2: topic repair using resources from the library.
- Week 3: timed Part I and Part II practice.
- Week 4: full paper simulation with review.
""",
        },
        "nmtc-math-problem-set-roadmap": {
            "title": "NMTC Math Problem Set Roadmap",
            "category": "Mathematics",
            "level": "Intermediate",
            "readTime": "14 min",
            "source": SOURCE_FOLDERS["math-problem-sets"],
            "body": """
## How The Math Sets Are Organized

The NMTC problem sets begin with algebra, number theory, combinatorics, and geometry handouts, then move into long-form problem sets with separate solutions.

## Recommended Order

1. Week 1 Algebra handout, then Problem Set 1.
1. Week 2 Number Theory handout, then selected problems from Sets 1 and 2.
1. Week 3 Combinatorics handout, then timed proof-writing.
1. Week 4 Geometry handout, then diagram-heavy problems.

## How To Review

Write a clean solution after every serious attempt. Mark the exact idea you missed: substitution, invariant, angle chase, counting model, or construction.
""",
        },
        "physics-calculus-and-nstc-prep": {
            "title": "Physics Calculus and NSTC Prep",
            "category": "Physics",
            "level": "Intermediate",
            "readTime": "15 min",
            "source": SOURCE_FOLDERS["physics-2"],
            "body": """
## Why Calculus Helps

The official screening test can be solved with school mathematics, but calculus makes motion, rates, graphs, and energy arguments cleaner. The downloaded Calculus Day handouts are a compact bridge.

## Sequence

1. Day 1: rates, slopes, and graphical meaning.
1. Day 2: derivatives in kinematics.
1. Day 3: integration and accumulated quantities.
1. Day 4: mechanics problems that combine calculus with physical reasoning.

## Where To Use It

Use calculus to understand formulas, but keep algebraic and conceptual shortcuts ready for MCQs.
""",
        },
        "biology-foundations-for-nstc": {
            "title": "Biology Foundations for NSTC",
            "category": "Biology",
            "level": "Beginner",
            "readTime": "12 min",
            "source": SOURCE_FOLDERS["biology"],
            "body": """
## Core Chapters

The biology resource folder begins with evolution, chemistry of life, water, carbon, and molecular diversity. These topics support the conceptual language that appears in NSTC Part I and biology-specific papers.

## Study Method

- Build vocabulary first.
- Draw process maps for cycles and pathways.
- Practice MCQs immediately after reading.
- Keep examples from Pakistani textbooks and Campbell-style chapters separate in your notes.
""",
        },
        "chemistry-practice-and-icho-resources": {
            "title": "Chemistry Practice and IChO Resources",
            "category": "Chemistry",
            "level": "Advanced",
            "readTime": "13 min",
            "source": SOURCE_FOLDERS["chemistry"],
            "body": """
## Available Chemistry Material

The chemistry folder exposes IChO practice problems and past-paper resources. Some files were restricted by Google Drive during ingestion, so the site records the folder as the authoritative source and indexes accessible documents when available.

## Preparation Focus

1. Stoichiometry and equilibrium for screening.
1. Organic pattern recognition for IChO-style problems.
1. Laboratory reasoning for practical exams.
1. Full official papers once fundamentals are stable.
""",
        },
    }
    for slug, guide in guides.items():
        mdx = f"""---
title: {guide['title']}
description: Source-backed preparation guide built from the provided Pakistan Olympiads resource folders.
category: {guide['category']}
level: {guide['level']}
readTime: {guide['readTime']}
author: Pakistan Olympiads Editorial Team
updated: 2026-05-06
sourceUrl: {guide['source']}
tags: [{guide['category']}, Resources, Roadmap]
featured: false
---

{guide['body'].strip()}
"""
        (GUIDES_DIR / f"{slug}.mdx").write_text(mdx, encoding="utf-8")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_RESOURCES.mkdir(parents=True, exist_ok=True)
    PUBLIC_PAPER_ASSETS.mkdir(parents=True, exist_ok=True)
    GUIDES_DIR.mkdir(parents=True, exist_ok=True)

    resources: list[dict[str, Any]] = []
    past_papers: list[dict[str, Any]] = []
    questions: list[dict[str, Any]] = []
    seen_hashes: set[str] = set()

    all_pdfs = sorted(DRIVE.rglob("*.pdf"))
    for path in all_pdfs:
        digest = sha1(path)
        if digest in seen_hashes:
            continue
        seen_hashes.add(digest)
        rel = path.relative_to(DRIVE)
        root_folder = rel.parts[0]
        subject = infer_subject(path)
        kind = infer_kind(path)
        title = path.stem.replace("_", " ").replace("-", " ").strip()
        year = infer_year(path)
        pages = pdf_pages(path)
        local_url = copy_resource(path, root_folder)
        resource_id = slugify(f"{root_folder}-{path.stem}")
        resource = {
            "id": resource_id,
            "title": title,
            "subject": subject,
            "kind": kind,
            "folder": root_folder,
            "year": year,
            "pages": pages,
            "sizeBytes": path.stat().st_size,
            "localUrl": local_url,
            "sourceUrl": SOURCE_FOLDERS.get(root_folder, ""),
        }
        resources.append(resource)

        is_past = root_folder.startswith("past-papers") and path.suffix.lower() == ".pdf"
        if is_past:
            paper_id = slugify(f"{subject}-{year or 'unknown'}-{path.stem}-{digest[:7]}")
            paper = {
                "id": paper_id,
                "title": f"NSTC {year or 2025} {subject} Paper",
                "exam": "NSTC",
                "subject": subject,
                "year": year or 2025,
                "pages": pages,
                "resourceUrl": local_url,
                "sourceUrl": SOURCE_FOLDERS.get(root_folder, ""),
                "scanned": root_folder == "past-papers-4",
                "pageImages": [],
                "questionCount": 0,
            }
            page_images = render_pdf_pages(path, paper_id)
            paper["pageImages"] = page_images
            if root_folder == "past-papers-4":
                paper_questions = ocr_scanned_paper(path, paper, page_images)
            else:
                paper_questions = split_numbered_questions(pdf_text_by_page(path), paper, page_images)
            paper["questionCount"] = len(paper_questions)
            past_papers.append(paper)
            questions.extend(paper_questions)

        if root_folder == "math-problem-sets" and "problem_set" in path.stem.lower():
            questions.extend(extract_math_problem_set(path, resource_id, title))

    resources.sort(key=lambda r: (r["subject"], r["kind"], r["title"]))
    past_papers.sort(key=lambda p: (p["year"], p["subject"]))
    ensure_unique_question_ids(questions)
    questions.sort(key=lambda q: (q["subject"], q["year"], q["source"], q["number"]))

    (DATA_DIR / "resources.json").write_text(json.dumps(resources, indent=2, ensure_ascii=False), encoding="utf-8")
    (DATA_DIR / "past-papers.json").write_text(json.dumps(past_papers, indent=2, ensure_ascii=False), encoding="utf-8")
    (DATA_DIR / "questions.json").write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    notion_to_mdx()
    build_guides_from_sources()
    print(f"resources={len(resources)} papers={len(past_papers)} questions={len(questions)}")


if __name__ == "__main__":
    main()
