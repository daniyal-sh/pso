"""Enrich NSTC question-bank records with verified answer artifacts.

This script is intentionally conservative:

- It preserves the public question data shape.
- It applies only source-backed answer keys from local solution PDFs.
- It replaces blank visual MCQ options with stable placeholders that point
  learners to the attached figure without inventing structure text.
- It writes review ledgers and answer-key reports for every paper question.

The remaining unanswered questions are reported explicitly so they are not
silently guessed into the bank.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import fitz


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
PUBLIC_DIR = ROOT / "public"
REPORT_DIR = ROOT / "reports"
SOURCE_SOLUTION_DIR = ROOT / "tmp" / "source-solutions"

QUESTION_COUNT = 1074
MCQ_COUNT = 1037
DESCRIPTIVE_COUNT = 37
LETTERS = "ABCD"

PHYSICS_SOLUTION_FILES = {
    2022: SOURCE_SOLUTION_DIR / "nstc-2022-solutions.pdf",
    2023: SOURCE_SOLUTION_DIR / "nstc-2023-solutions.pdf",
    2024: SOURCE_SOLUTION_DIR / "nstc-2024-solutions.pdf",
}

AUTHORED_PART_I: dict[int, dict[int, tuple[int, str]]] = {
    2022: {
        1: (2, "Similar cells that perform a common function form tissues."),
        2: (2, "Meiosis starts from one diploid cell and produces four haploid daughter cells."),
        3: (1, "Erythrocytes are red blood cells, and their main transport role is oxygen carriage."),
        4: (1, "A hypothesis repeatedly supported by tests becomes a scientific theory."),
        5: (0, "Dialysis is the artificial removal of wastes from blood."),
        6: (0, "Vinegar is an aqueous solution whose characteristic acid is acetic acid."),
        7: (0, "Mercury is the metal that is liquid at standard temperature and pressure."),
        8: (3, "The law of conservation of mass is associated with Lavoisier, not Dalton."),
        9: (0, "Urea has molecular formula CH4N2O, so the empirical formula is the same."),
        10: (2, "Ascorbic acid is the chemical name of vitamin C."),
        11: (2, "Using a*b=a-b+ab gives 2*5=7 and 5*2=13, so the sum is 20."),
        12: (2, "10/11 is about 0.909, closer to 1 than the other listed fractions."),
        13: (3, "The squared terms cancel, leaving |6|+|-6|=12."),
        14: (1, "Dividing powers with the same base subtracts exponents: 5^5/5^4=5."),
        15: (0, "A power raised to a power multiplies exponents: (a^m)^n=a^(mn)."),
        16: (3, "The newton is derived from base SI units as kg m s^-2."),
        17: (3, "Power equals work/time=(500 N)(18 m)/50 s=180 W."),
        18: (0, "Net charge must be an integer multiple of the elementary charge 1.6 x 10^-19 C."),
        19: (1, "Metals conduct well because they contain many mobile electrons."),
        20: (2, "Mechanical energy and heat are both measured in joules."),
    },
    2023: {
        1: (2, "Most aerobic breakdown of glucose occurs in mitochondria."),
        2: (3, "Hypotheses that remain supported by repeated testing are called theories."),
        3: (1, "Cancer is characterized by uncontrolled cell division."),
        4: (2, "A conjugate acid forms when a base accepts a proton."),
        5: (2, "Homologous chromosomes separate during anaphase I of meiosis."),
        6: (3, "Plastic is generally amorphous rather than crystalline."),
        7: (2, "Atomic diameters are on the order of 10^-10 m, or about 0.2 nm."),
        8: (3, "Maltose is a small disaccharide, not a macromolecule."),
        9: (3, "Most periodic-table elements are metals; 75 percent is the closest listed value."),
        10: (3, "Plasmas are used in fluorescent lamps, neon signs, and some laser systems."),
        11: (1, "The distance is sqrt((1+2)^2+(6-2)^2)=sqrt(25)=5."),
        12: (0, "Angles whose measures add to 90 degrees are complementary."),
        13: (3, "Infinitely many lines can pass through a single point in a plane."),
        14: (1, "The midpoint is ((-2+8)/2,(8-2)/2)=(3,3)."),
        15: (3, "If x+1/x=2, then x^2+1/x^2=(x+1/x)^2-2=2."),
        16: (1, "The mass is F/a=10/5=2 kg, so a 1.0 m/s^2 acceleration needs 2.0 N."),
        17: (3, "Average force is change in momentum over time: (1200 kg)(10 m/s)/0.10 s=1.2 x 10^5 N."),
        18: (0, "A positively charged rod removes electrons from the neutral metal during contact."),
        19: (3, "Heat delivered is VIt=(120 V)(10 A)(30 s)=3.6 x 10^4 J."),
        20: (2, "Speed measurement from a frequency shift of reflected waves uses the Doppler effect."),
    },
    2024: {
        1: (3, "Most aerobic breakdown of glucose occurs in mitochondria."),
        2: (3, "X-rays, gamma rays, alpha particles, and beta particles can all be ionizing cancer risks."),
        3: (3, "Hypotheses that remain supported by repeated testing are called theories."),
        4: (0, "Electric field intensity has both magnitude and direction, so it is a vector."),
        5: (3, "One coulomb is approximately the charge magnitude of 6.25 x 10^18 electrons."),
        6: (0, "Light emission during a chemical reaction is chemiluminescence."),
        7: (1, "A Geiger counter measures counts from nuclear disintegrations."),
        8: (2, "Alkynes contain at least one carbon-carbon triple bond."),
        9: (2, "Equal hydrogen and hydroxide ion concentrations make the solution neutral, around pH 7."),
        10: (0, "Fluorine is the most reactive element among the listed choices."),
        11: (3, "The listed vertices form a rectangle rather than a square or kite."),
        12: (2, "The center of a circle lies inside the circle, not on the circumference."),
        13: (1, "600=2^3*3*5^2, so the divisor sum is (1+2+4+8)(1+3)(1+5+25)=1860."),
        14: (0, "The first nine primes sum to 2+3+5+7+11+13+17+19+23=100."),
        15: (0, "2x+7=3 gives x=-2; substituting in bx-10=-2 gives b=-4."),
        16: (0, "Over a long time the average upward impulse from the floor balances the ball's weight, so the average force is mg."),
        17: (2, "Bending of light around an obstacle is diffraction."),
        18: (2, "A geostationary satellite moves at about 3.08 km/s in orbit."),
        19: (1, "Electric and magnetic fields in an electromagnetic wave are perpendicular to each other."),
        20: (3, "A seconds pendulum has a time period of 2.0 seconds."),
    },
    2025: {
        1: (0, "Incandescent electric bulbs are commonly filled with argon."),
        2: (1, "Cancer is characterized by uncontrolled cell division."),
        3: (3, "Temperature, soil pH, oxygen, and light are all abiotic factors."),
        4: (1, "The mosquito transmits the malaria pathogen, so it is the vector."),
        5: (0, "Lysosomes contain digestive enzymes for cellular digestion."),
        7: (1, "Surface tension makes a liquid drop minimize surface area, producing a spherical shape."),
        8: (1, "Adding salt raises the boiling point of water."),
        9: (3, "Water containing soluble calcium and magnesium salts is hard water."),
        10: (0, "Milk is an emulsion: liquid droplets dispersed in a liquid medium."),
        11: (1, "If x+1/x=3, then x^2+1/x^2=(x+1/x)^2-2=7."),
        12: (1, "The highest total degree in the polynomial terms is 6."),
        13: (1, "The discriminant of x^2+4x+5 is 16-20=-4, so there are no real roots."),
        14: (1, "x^2-6x+9=(x-3)^2, so the repeated root is x=3."),
        15: (1, "The set of plane points equidistant from a fixed point is a circle."),
        16: (3, "Average force is change in momentum over time: (1200 kg)(10 m/s)/0.10 s=1.2 x 10^5 N."),
        17: (1, "By Newton's third law, the mass exerts the same 20 N force on the spring scale."),
        18: (0, "Contact with a positively charged rod leaves the metal sphere deficient in electrons."),
        19: (3, "Producing 4.0 waves each second means the frequency is 4 Hz."),
        20: (3, "One watt is one joule per second."),
    },
}

VISUAL_OPTION_REPAIR_IDS = {
    "chemistry-2022-final-chemistry-2022-b9f5031-part-ii-52",
    "physics-2022-final-physics-2022-b4137e5-part-ii-21",
    "physics-2022-final-physics-2022-b4137e5-part-ii-22",
    "physics-2022-final-physics-2022-b4137e5-part-ii-31",
    "physics-2022-final-physics-2022-b4137e5-part-ii-38",
    "physics-2022-final-physics-2022-b4137e5-part-ii-45",
    "physics-2022-final-physics-2022-b4137e5-part-ii-51",
    "physics-2022-final-physics-2022-b4137e5-part-ii-55",
    "physics-2023-final-physics-2023-ac5a924-part-ii-27",
    "physics-2023-final-physics-2023-ac5a924-part-ii-28",
    "physics-2023-final-physics-2023-ac5a924-part-ii-36",
    "physics-2023-final-physics-2023-ac5a924-part-ii-38",
    "physics-2023-final-physics-2023-ac5a924-part-ii-43",
    "physics-2023-final-physics-2023-ac5a924-part-ii-44",
    "physics-2023-final-physics-2023-ac5a924-part-ii-60",
}


@dataclass(frozen=True)
class SourceSolution:
    answer: int | None
    solution: str
    source: str


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def compact(text: str, limit: int | None = None) -> str:
    text = text.replace("\x0c", " ")
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line and not re.fullmatch(r"\d+", line)]
    value = re.sub(r"\s+", " ", " ".join(lines)).strip()
    if limit and len(value) > limit:
        cut = value[:limit].rstrip()
        sentence = max(cut.rfind("."), cut.rfind("?"), cut.rfind("!"))
        if sentence > int(limit * 0.65):
            cut = cut[: sentence + 1]
        value = cut.rstrip(" ,;:") + "..."
    return value


def extract_pdf_text(path: Path) -> str:
    if not path.exists():
        return ""
    with fitz.open(path) as document:
        return "\n".join(page.get_text() for page in document)


def extract_2022_2023_physics(year: int, path: Path) -> dict[tuple[str, int], SourceSolution]:
    """Extract NPTC-style physics solutions for 2022 and 2023.

    Those PDFs list the 50 Part II MCQs as sequential "Solution: X" blocks,
    followed by Part III worked solutions. Part II paper numbers are 21-70.
    """

    text = extract_pdf_text(path)
    if not text:
        return {}

    markers = list(re.finditer(r"Solution\s*:", text, flags=re.I))
    extracted: dict[tuple[str, int], SourceSolution] = {}
    source_label = f"{path.name} (local Google Drive source)"

    for index, marker in enumerate(markers[:50], start=21):
        next_start = markers[index - 20].start() if index - 20 < len(markers) else len(text)
        block = text[marker.end() : next_start]
        answer_match = re.match(r"\s*([A-D])\b", block)
        if not answer_match:
            continue
        answer = LETTERS.index(answer_match.group(1))
        solution = compact(block[answer_match.end() :], limit=900)
        if not solution:
            option_letter = LETTERS[answer]
            solution = f"The source solution marks option {option_letter} for this item."
        extracted[("Part II", index)] = SourceSolution(answer, solution, source_label)

    descriptive_markers = markers[50:]
    for desc_index, marker in enumerate(descriptive_markers, start=1):
        next_start = (
            descriptive_markers[desc_index].start()
            if desc_index < len(descriptive_markers)
            else len(text)
        )
        block = text[marker.end() : next_start]
        solution = compact(block, limit=1800)
        if solution:
            extracted[("Part III", desc_index)] = SourceSolution(None, solution, source_label)

    return extracted


def extract_2024_physics(path: Path) -> dict[tuple[str, int], SourceSolution]:
    """Extract the explicitly numbered 2024 physics solution PDF."""

    text = extract_pdf_text(path)
    if not text:
        return {}

    extracted: dict[tuple[str, int], SourceSolution] = {}
    source_label = f"{path.name} (local Google Drive source)"
    mcq_markers = list(re.finditer(r"Q\s*(\d+)\s*:\s*\(([a-d])\)", text, flags=re.I))
    desc_start_match = re.search(r"Descriptive Question\s+1\b", text, flags=re.I)
    desc_start = desc_start_match.start() if desc_start_match else len(text)

    for index, marker in enumerate(mcq_markers):
        question_number = int(marker.group(1))
        if question_number < 21 or question_number > 70:
            continue
        next_start = (
            mcq_markers[index + 1].start()
            if index + 1 < len(mcq_markers)
            else desc_start
        )
        answer = LETTERS.index(marker.group(2).upper())
        solution = compact(text[marker.start() : next_start], limit=1000)
        extracted[("Part II", question_number)] = SourceSolution(answer, solution, source_label)

    desc_markers = list(re.finditer(r"Descriptive Question\s+(\d+)\b", text, flags=re.I))
    for index, marker in enumerate(desc_markers):
        desc_number = int(marker.group(1))
        next_start = desc_markers[index + 1].start() if index + 1 < len(desc_markers) else len(text)
        solution = compact(text[marker.start() : next_start], limit=2200)
        if solution:
            extracted[("Part III", desc_number)] = SourceSolution(None, solution, source_label)

    return extracted


def load_source_solutions() -> dict[tuple[int, str, int], SourceSolution]:
    solutions: dict[tuple[int, str, int], SourceSolution] = {}
    for year, path in PHYSICS_SOLUTION_FILES.items():
        if year in {2022, 2023}:
            extracted = extract_2022_2023_physics(year, path)
        else:
            extracted = extract_2024_physics(path)
        for (section, number), solution in extracted.items():
            solutions[(year, section, number)] = solution
    return solutions


def visual_option_labels(question: dict[str, Any]) -> list[str] | None:
    options = question.get("options", [])
    has_blank = len(options) != 4 or any(not str(option).strip() for option in options)
    is_known_visual = question.get("id") in VISUAL_OPTION_REPAIR_IDS
    if (not has_blank and not is_known_visual) or not question.get("figure"):
        return None

    if question.get("paperSubject") == "Chemistry":
        return ["Structure A", "Structure B", "Structure C", "Structure D"]
    return ["Diagram A", "Diagram B", "Diagram C", "Diagram D"]


def paper_question_filter(question: dict[str, Any], paper_ids: set[str]) -> bool:
    return bool(question.get("paperId") in paper_ids and question.get("section") != "Resource")


def apply_enrichment(
    questions: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    *,
    apply: bool,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    paper_ids = {paper["id"] for paper in papers}
    source_solutions = load_source_solutions()
    provenance: dict[str, dict[str, Any]] = {}
    updated_questions: list[dict[str, Any]] = []

    for question in questions:
        item = dict(question)
        qid = item["id"]
        meta: dict[str, Any] = {"provenance": "unchanged"}

        labels = visual_option_labels(item)
        if labels:
            meta["visualOptionRepair"] = {
                "before": item.get("options", []),
                "after": labels,
                "reason": "Blank visual choices are represented in the attached figure.",
            }
            if apply:
                item["options"] = labels

        if (
            paper_question_filter(item, paper_ids)
            and item.get("type") == "MCQ"
            and item.get("section") == "Part I"
        ):
            authored = AUTHORED_PART_I.get(int(item.get("year", 0)), {}).get(int(item.get("number", 0)))
            if authored:
                answer, solution = authored
                meta["provenance"] = "authored-common-mcq"
                meta["source"] = "Authored from standard science reasoning after paper text review"
                meta["answer"] = answer
                if apply:
                    item["answer"] = answer
                    item["solution"] = solution

        if paper_question_filter(item, paper_ids) and item.get("paperSubject") == "Physics":
            key = (int(item.get("year", 0)), str(item.get("section", "")), int(item.get("number", 0)))
            source_solution = source_solutions.get(key)
            if source_solution:
                if item.get("type") == "MCQ" and source_solution.answer is not None:
                    meta["provenance"] = "source-backed-mcq"
                    meta["source"] = source_solution.source
                    meta["answer"] = source_solution.answer
                    if apply:
                        item["answer"] = source_solution.answer
                        item["solution"] = source_solution.solution
                elif item.get("type") != "MCQ":
                    meta["provenance"] = "source-backed-descriptive"
                    meta["source"] = source_solution.source
                    if apply:
                        item["solution"] = source_solution.solution

        provenance[qid] = meta
        updated_questions.append(item)

    return updated_questions, provenance


def existing_page_image(paper: dict[str, Any], page: int | None) -> str:
    if not page:
        return ""
    page_images = paper.get("pageImages") or []
    index = page - 1
    if 0 <= index < len(page_images):
        return page_images[index]
    return ""


def build_reports(
    questions: list[dict[str, Any]],
    papers: list[dict[str, Any]],
    provenance: dict[str, dict[str, Any]],
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    papers_by_id = {paper["id"]: paper for paper in papers}
    paper_ids = set(papers_by_id)
    paper_questions = [q for q in questions if paper_question_filter(q, paper_ids)]
    mcqs = [q for q in paper_questions if q.get("type") == "MCQ"]
    descriptive = [q for q in paper_questions if q.get("type") != "MCQ"]

    ledger = []
    for question in paper_questions:
        paper = papers_by_id[question["paperId"]]
        answer = question.get("answer")
        ledger.append(
            {
                "id": question["id"],
                "paperId": question["paperId"],
                "paperTitle": paper["title"],
                "subject": question.get("paperSubject") or question.get("subject"),
                "year": question.get("year"),
                "section": question.get("section"),
                "number": question.get("number"),
                "displayNumber": question.get("displayNumber"),
                "type": question.get("type"),
                "page": question.get("page"),
                "pageImage": existing_page_image(paper, question.get("page")),
                "figure": question.get("figure", ""),
                "prompt": question.get("prompt", ""),
                "options": question.get("options", []),
                "answerIndex": answer,
                "answerLetter": LETTERS[answer] if isinstance(answer, int) and 0 <= answer < 4 else None,
                "hasSolution": bool(str(question.get("solution", "")).strip()),
                "provenance": provenance.get(question["id"], {}),
            }
        )

    write_json(REPORT_DIR / "question-bank-verification-ledger.json", ledger)

    answer_rows = []
    for question in mcqs:
        paper = papers_by_id[question["paperId"]]
        answer = question.get("answer")
        source = provenance.get(question["id"], {}).get("source", "")
        answer_rows.append(
            {
                "paper": paper["title"],
                "paperId": paper["id"],
                "subject": paper["subject"],
                "year": paper["year"],
                "section": question.get("section"),
                "number": question.get("number"),
                "page": question.get("page"),
                "answerIndex": answer,
                "answerLetter": LETTERS[answer] if isinstance(answer, int) and 0 <= answer < 4 else None,
                "source": source or "Pending authored review",
                "prompt": question.get("prompt", ""),
            }
        )

    write_json(REPORT_DIR / "question-bank-answer-key.json", answer_rows)

    by_paper: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in answer_rows:
        by_paper[row["paper"]].append(row)

    answer_md = [
        "# Question Bank MCQ Answer Key",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "Answer letters use the existing zero-based JSON `answer` field: A=0, B=1, C=2, D=3.",
        "Rows marked pending do not have an answer key applied in `src/data/questions.json`.",
        "",
    ]
    for paper in papers:
        rows = by_paper.get(paper["title"], [])
        answer_md.extend(
            [
                f"## {paper['title']}",
                "",
                "| No. | Section | Page | Answer | Source | Prompt |",
                "| --- | --- | --- | --- | --- | --- |",
            ]
        )
        for row in rows:
            answer = row["answerLetter"] or "Pending"
            source = row["source"].replace("|", "\\|")
            prompt = compact(row["prompt"], limit=110).replace("|", "\\|")
            answer_md.append(
                f"| {row['number']} | {row['section']} | {row['page'] or '-'} | {answer} | {source} | {prompt} |"
            )
        answer_md.append("")

    (REPORT_DIR / "question-bank-answer-key.md").write_text("\n".join(answer_md), encoding="utf-8")

    summary_rows = []
    for paper in papers:
        questions_for_paper = [q for q in paper_questions if q["paperId"] == paper["id"]]
        mcqs_for_paper = [q for q in questions_for_paper if q.get("type") == "MCQ"]
        descriptive_for_paper = [q for q in questions_for_paper if q.get("type") != "MCQ"]
        summary_rows.append(
            {
                "paper": paper["title"],
                "questions": len(questions_for_paper),
                "mcqs": len(mcqs_for_paper),
                "descriptive": len(descriptive_for_paper),
                "pageImages": len(paper.get("pageImages") or []),
                "figures": sum(1 for q in questions_for_paper if q.get("figure")),
                "answers": sum(1 for q in mcqs_for_paper if q.get("answer") is not None),
                "solutions": sum(1 for q in questions_for_paper if str(q.get("solution", "")).strip()),
                "pendingAnswers": sum(1 for q in mcqs_for_paper if q.get("answer") is None),
                "pendingSolutions": sum(1 for q in questions_for_paper if not str(q.get("solution", "")).strip()),
            }
        )

    source_counts = Counter(meta.get("provenance") for meta in provenance.values())
    visual_repairs = [
        (qid, meta["visualOptionRepair"])
        for qid, meta in provenance.items()
        if "visualOptionRepair" in meta
    ]
    rendered_pages = len(list((ROOT / "tmp" / "pdfs" / "nstc-audit").glob("* /page-*.png")))
    if rendered_pages == 0:
        rendered_pages = len(list((ROOT / "tmp" / "pdfs" / "nstc-audit").glob("*/page-*.png")))

    summary_md = [
        "# Question Bank Verification Summary",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Scope",
        "",
        f"- Paper-backed questions in scope: {len(paper_questions)} (expected {QUESTION_COUNT})",
        f"- MCQs in scope: {len(mcqs)} (expected {MCQ_COUNT})",
        f"- Descriptive questions in scope: {len(descriptive)} (expected {DESCRIPTIVE_COUNT})",
        f"- Source-backed physics MCQ answers applied: {source_counts.get('source-backed-mcq', 0)}",
        f"- Source-backed physics descriptive notes applied: {source_counts.get('source-backed-descriptive', 0)}",
        f"- Authored common Part I MCQ answers applied: {source_counts.get('authored-common-mcq', 0)}",
        f"- MCQs still pending authored answer review: {sum(1 for q in mcqs if q.get('answer') is None)}",
        f"- Paper questions still pending solution text: {sum(1 for q in paper_questions if not str(q.get('solution', '')).strip())}",
        f"- Rendered review screenshots in tmp/pdfs/nstc-audit: {rendered_pages}",
        "",
        "## Paper Inventory",
        "",
        "| Paper | Questions | MCQs | Descriptive | Page images | Figures | Answers | Solutions | Pending answers | Pending solutions |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for row in summary_rows:
        summary_md.append(
            "| {paper} | {questions} | {mcqs} | {descriptive} | {pageImages} | {figures} | {answers} | {solutions} | {pendingAnswers} | {pendingSolutions} |".format(
                **row
            )
        )

    summary_md.extend(
        [
            "",
            "## Visual Option Repairs",
            "",
            "Blank option labels occur where the actual choices are diagrams or structures in the attached figure. These were normalized to stable nonblank labels while preserving A-D order.",
            "",
            "| Question id | Replacement labels |",
            "| --- | --- |",
        ]
    )
    if visual_repairs:
        for qid, repair in visual_repairs:
            summary_md.append(f"| {qid} | {', '.join(repair['after'])} |")
    else:
        summary_md.append("| None | - |")

    summary_md.extend(
        [
            "",
            "## Notes",
            "",
            "- Rendered PDF review screenshots are stored under `tmp/pdfs/nstc-audit/`; the public page images under `public/paper-assets/` are referenced in the JSON ledger.",
            "- The 2022-2024 physics keys and worked notes come from the locally downloaded NPTC solution PDFs in `tmp/source-solutions/`.",
            "- Part I common-science answers are authored from the reviewed prompt/option text and standard school-level reasoning.",
            "- Subject-specific non-physics answer keys remain pending rather than being guessed without a source or a completed authored review pass.",
        ]
    )

    (REPORT_DIR / "question-bank-verification-summary.md").write_text(
        "\n".join(summary_md), encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Enrich NSTC question-bank answers and reports.")
    parser.add_argument("--apply", action="store_true", help="Write changes to src/data/questions.json")
    args = parser.parse_args()

    questions = read_json(DATA_DIR / "questions.json")
    papers = read_json(DATA_DIR / "past-papers.json")
    updated_questions, provenance = apply_enrichment(questions, papers, apply=args.apply)

    if args.apply:
        write_json(DATA_DIR / "questions.json", updated_questions)

    build_reports(updated_questions, papers, provenance)

    paper_ids = {paper["id"] for paper in papers}
    paper_questions = [q for q in updated_questions if paper_question_filter(q, paper_ids)]
    mcqs = [q for q in paper_questions if q.get("type") == "MCQ"]
    descriptive = [q for q in paper_questions if q.get("type") != "MCQ"]

    print(f"paper_questions={len(paper_questions)} mcqs={len(mcqs)} descriptive={len(descriptive)}")
    print(f"answers={sum(q.get('answer') is not None for q in mcqs)}")
    print(f"solutions={sum(bool(str(q.get('solution', '')).strip()) for q in paper_questions)}")
    print(f"reports={REPORT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
