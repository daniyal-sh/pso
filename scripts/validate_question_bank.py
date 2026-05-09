"""Strict validation for the NSTC question-bank completion workflow."""

from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
PUBLIC_DIR = ROOT / "public"
REPORT_DIR = ROOT / "reports"

EXPECTED_PAPER_QUESTIONS = 1074
EXPECTED_MCQS = 1037
EXPECTED_DESCRIPTIVE = 37


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def paper_question_filter(question: dict[str, Any], paper_ids: set[str]) -> bool:
    return bool(question.get("paperId") in paper_ids and question.get("section") != "Resource")


def main() -> int:
    questions = read_json(DATA_DIR / "questions.json")
    papers = read_json(DATA_DIR / "past-papers.json")
    paper_ids = {paper["id"] for paper in papers}
    paper_questions = [q for q in questions if paper_question_filter(q, paper_ids)]
    mcqs = [q for q in paper_questions if q.get("type") == "MCQ"]
    descriptive = [q for q in paper_questions if q.get("type") != "MCQ"]

    failures: list[dict[str, Any]] = []

    def fail(kind: str, message: str, question: dict[str, Any] | None = None) -> None:
        entry: dict[str, Any] = {"kind": kind, "message": message}
        if question:
            entry.update(
                {
                    "id": question.get("id"),
                    "paperId": question.get("paperId"),
                    "section": question.get("section"),
                    "number": question.get("number"),
                }
            )
        failures.append(entry)

    if len(paper_questions) != EXPECTED_PAPER_QUESTIONS:
        fail("count", f"Expected {EXPECTED_PAPER_QUESTIONS} paper questions, found {len(paper_questions)}")
    if len(mcqs) != EXPECTED_MCQS:
        fail("count", f"Expected {EXPECTED_MCQS} MCQs, found {len(mcqs)}")
    if len(descriptive) != EXPECTED_DESCRIPTIVE:
        fail("count", f"Expected {EXPECTED_DESCRIPTIVE} descriptive questions, found {len(descriptive)}")

    for question in mcqs:
        options = question.get("options")
        if not isinstance(options, list) or len(options) != 4:
            fail("options", "MCQ does not have exactly four options", question)
        elif any(not str(option).strip() for option in options):
            fail("options", "MCQ has one or more blank options", question)

        answer = question.get("answer")
        if not isinstance(answer, int) or answer < 0 or answer > 3:
            fail("answer", "MCQ answer is not an integer in 0..3", question)

    for question in paper_questions:
        if not str(question.get("solution", "")).strip():
            fail("solution", "Paper-backed question has no solution text", question)

        figure = str(question.get("figure", "")).strip()
        if figure:
            figure_path = PUBLIC_DIR / figure.lstrip("/")
            if not figure_path.exists():
                fail("figure", f"Referenced figure does not exist: {figure}", question)

    by_kind = Counter(failure["kind"] for failure in failures)
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "paperQuestions": len(paper_questions),
            "mcqs": len(mcqs),
            "descriptive": len(descriptive),
            "failures": len(failures),
            "failuresByKind": dict(sorted(by_kind.items())),
        },
        "failures": failures,
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / "question-bank-validation.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    lines = [
        "# Question Bank Validation",
        "",
        f"Generated: {report['generatedAt']}",
        "",
        f"- Paper-backed questions: {len(paper_questions)} / {EXPECTED_PAPER_QUESTIONS}",
        f"- MCQs: {len(mcqs)} / {EXPECTED_MCQS}",
        f"- Descriptive questions: {len(descriptive)} / {EXPECTED_DESCRIPTIVE}",
        f"- Failures: {len(failures)}",
        "",
    ]
    if failures:
        lines.extend(["## Failures By Kind", ""])
        for kind, count in sorted(by_kind.items()):
            lines.append(f"- {kind}: {count}")
        lines.extend(["", "## First 100 Failures", "", "| Kind | Question | Message |", "| --- | --- | --- |"])
        for failure in failures[:100]:
            question_label = failure.get("id") or "-"
            message = str(failure["message"]).replace("|", "\\|")
            lines.append(f"| {failure['kind']} | {question_label} | {message} |")
    else:
        lines.append("All checks passed.")

    (REPORT_DIR / "question-bank-validation.md").write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(report["summary"], indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
