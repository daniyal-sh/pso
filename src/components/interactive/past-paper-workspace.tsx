"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PdfViewer } from "@/components/interactive/pdf-viewer";
import { Badge } from "@/components/sections/common";
import type { PastPaper, Question } from "@/lib/content-data";
import { cn } from "@/lib/utils";

type AnswerChoice = "A" | "B" | "C" | "D";
type WorkspaceSection = "part-i" | "part-ii" | "descriptive";

type AttemptState = {
  paperId: string;
  mcqAnswers: Record<string, AnswerChoice | null>;
  descriptiveAnswer: string;
  descriptiveSolutionFileName: string;
  activeQuestion: number | null;
  timerSecondsRemaining: number;
  timerRunning: boolean;
  submittedAt: string | null;
  updatedAt: string | null;
};

const PAST_PAPER_TIMER_SECONDS = 3 * 60 * 60;
const MCQ_NUMBERS = Array.from({ length: 70 }, (_, index) => index + 1);
const PART_I_NUMBERS = MCQ_NUMBERS.slice(0, 20);
const PART_II_NUMBERS = MCQ_NUMBERS.slice(20);
const CHOICES: AnswerChoice[] = ["A", "B", "C", "D"];

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

function storageKey(paperId: string) {
  return `pso:past-paper-attempt:${paperId}`;
}

function createEmptyAnswers() {
  return Object.fromEntries(MCQ_NUMBERS.map((number) => [String(number), null])) as Record<string, AnswerChoice | null>;
}

function createInitialAttempt(paper: PastPaper): AttemptState {
  return {
    paperId: paper.id,
    mcqAnswers: createEmptyAnswers(),
    descriptiveAnswer: "",
    descriptiveSolutionFileName: "",
    activeQuestion: null,
    timerSecondsRemaining: PAST_PAPER_TIMER_SECONDS,
    timerRunning: false,
    submittedAt: null,
    updatedAt: null,
  };
}

function normalizeAttempt(paper: PastPaper, value: Partial<AttemptState> | null): AttemptState {
  const initial = createInitialAttempt(paper);
  if (!value || value.paperId !== paper.id) return initial;
  return {
    ...initial,
    ...value,
    mcqAnswers: { ...initial.mcqAnswers, ...(value.mcqAnswers ?? {}) },
    descriptiveSolutionFileName: typeof value.descriptiveSolutionFileName === "string" ? value.descriptiveSolutionFileName : "",
    timerSecondsRemaining: Math.max(0, value.timerSecondsRemaining ?? PAST_PAPER_TIMER_SECONDS),
    timerRunning: Boolean(value.timerRunning && (value.timerSecondsRemaining ?? 0) > 0),
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function formatSavedAt(value: string | null) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function PastPaperWorkspace({ paper, questions, papers }: { paper: PastPaper; questions: Question[]; papers: PastPaper[] }) {
  const [attempt, setAttempt] = useState<AttemptState>(() => createInitialAttempt(paper));
  const [hydrated, setHydrated] = useState(false);
  const [section, setSection] = useState<WorkspaceSection>("part-i");

  const answeredCount = MCQ_NUMBERS.filter((number) => attempt.mcqAnswers[String(number)]).length;
  const progress = Math.round((answeredCount / MCQ_NUMBERS.length) * 100);
  const unansweredCount = MCQ_NUMBERS.length - answeredCount;
  const isReviewing = Boolean(attempt.submittedAt);
  const descriptiveWordCount = countWords(attempt.descriptiveAnswer);
  const hasDescriptiveDraft = attempt.descriptiveAnswer.trim().length > 0;
  const hasDescriptiveUpload = attempt.descriptiveSolutionFileName.trim().length > 0;
  const relatedPapers = useMemo(() => papers.filter((item) => item.id !== paper.id && item.subject === paper.subject).slice(0, 4), [paper.id, paper.subject, papers]);

  const answerKeyByQuestion = useMemo(() => {
    const map = new Map<number, AnswerChoice>();
    for (const question of questions) {
      if (question.type !== "MCQ" || question.answer === null) continue;
      const answer = CHOICES[question.answer];
      if (answer) map.set(question.number, answer);
    }
    return map;
  }, [questions]);

  const visibleNumbers = section === "part-i" ? PART_I_NUMBERS : PART_II_NUMBERS;
  const verifiedCount = answerKeyByQuestion.size;
  const correctCount = MCQ_NUMBERS.filter((number) => {
    const correct = answerKeyByQuestion.get(number);
    return correct && attempt.mcqAnswers[String(number)] === correct;
  }).length;

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey(paper.id));
        setAttempt(normalizeAttempt(paper, saved ? (JSON.parse(saved) as Partial<AttemptState>) : null));
      } catch {
        setAttempt(createInitialAttempt(paper));
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [paper]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey(paper.id), JSON.stringify({ ...attempt, updatedAt: new Date().toISOString() }));
  }, [attempt, hydrated, paper.id]);

  useEffect(() => {
    if (!attempt.timerRunning || attempt.timerSecondsRemaining <= 0) return;
    const id = window.setInterval(() => {
      setAttempt((previous) => {
        const nextSeconds = Math.max(0, previous.timerSecondsRemaining - 1);
        return {
          ...previous,
          timerSecondsRemaining: nextSeconds,
          timerRunning: nextSeconds > 0,
          updatedAt: new Date().toISOString(),
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [attempt.timerRunning, attempt.timerSecondsRemaining]);

  function updateAttempt(update: (previous: AttemptState) => AttemptState) {
    setAttempt((previous) => ({ ...update(previous), updatedAt: new Date().toISOString() }));
  }

  function focusQuestion(number: number) {
    updateAttempt((previous) => ({
      ...previous,
      activeQuestion: number,
    }));
  }

  function chooseAnswer(number: number, choice: AnswerChoice) {
    if (isReviewing) return;
    updateAttempt((previous) => ({
      ...previous,
      activeQuestion: number,
      mcqAnswers: { ...previous.mcqAnswers, [String(number)]: choice },
    }));
  }

  function clearCurrentMcq() {
    if (!attempt.activeQuestion || isReviewing) return;
    updateAttempt((previous) => ({
      ...previous,
      mcqAnswers: { ...previous.mcqAnswers, [String(previous.activeQuestion)]: null },
    }));
  }

  function resetAttempt() {
    if (!window.confirm(`Reset your saved attempt for ${paper.title}?`)) return;
    const fresh = createInitialAttempt(paper);
    window.localStorage.removeItem(storageKey(paper.id));
    setAttempt({ ...fresh, updatedAt: new Date().toISOString() });
    setSection("part-i");
  }

  function submitAttempt() {
    if (isReviewing) return;
    updateAttempt((previous) => ({
      ...previous,
      timerRunning: false,
      submittedAt: new Date().toISOString(),
    }));
  }

  function resumeAttempt() {
    updateAttempt((previous) => ({
      ...previous,
      submittedAt: null,
    }));
  }

  function switchPaper(id: string) {
    window.location.href = `/past-papers/${id}`;
  }

  return (
    <div className="space-y-3 pb-24 md:space-y-4 md:pb-0">
      <section className="rounded-md border border-navy/10 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{paper.exam}</Badge>
              <span className="rounded-md bg-mint px-2.5 py-1 text-xs font-black uppercase text-emerald">{paper.subject}</span>
              <span className="rounded-md bg-cool/70 px-2.5 py-1 text-xs font-black uppercase text-charcoal/70">{paper.year}</span>
              {isReviewing ? <span className="rounded-md bg-gold/20 px-2.5 py-1 text-xs font-black uppercase text-charcoal">Review mode</span> : null}
            </div>
            <h1 className="mt-3 text-xl font-black leading-tight text-charcoal sm:text-2xl md:text-3xl">{paper.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal/70 sm:text-base">
              {isReviewing
                ? "Review your submitted answers against the paper. Verified answer keys will be graded automatically when attached."
                : "Read the paper pages, record MCQ choices, and keep one descriptive response draft. Your work auto-saves in this browser."}
            </p>
          </div>

          <div className="rounded-md border border-navy/10 bg-ivory p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-charcoal/60">Timer</p>
                <p className={cn("font-mono text-3xl font-black", attempt.timerSecondsRemaining === 0 ? "text-red-600" : "text-charcoal")}>{formatTime(attempt.timerSecondsRemaining)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className={cn("flex h-11 w-11 items-center justify-center rounded-md text-white", attempt.timerRunning ? "bg-navy" : "bg-emerald")}
                  onClick={() => updateAttempt((previous) => ({ ...previous, timerRunning: !previous.timerRunning && previous.timerSecondsRemaining > 0 }))}
                  type="button"
                  aria-label={attempt.timerRunning ? "Pause timer" : "Start timer"}
                >
                  <Icon name={attempt.timerRunning ? "pause" : "play"} className="h-5 w-5" />
                </button>
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-navy/10 bg-white text-charcoal"
                  onClick={() => updateAttempt((previous) => ({ ...previous, timerRunning: false, timerSecondsRemaining: PAST_PAPER_TIMER_SECONDS }))}
                  type="button"
                  aria-label="Reset timer"
                >
                  <Icon name="reset" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-navy/10 bg-white px-3 py-2">
              <div className="flex items-center justify-between text-sm font-black text-charcoal">
                <span>{answeredCount} / 70 MCQs</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-cool">
                <div className="h-2 rounded-full bg-emerald" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-charcoal/60">
                {hasDescriptiveDraft ? `${descriptiveWordCount} descriptive words saved` : hasDescriptiveUpload ? "Solution file selected" : "Descriptive response empty"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label>
            <span className="text-xs font-black uppercase text-charcoal/60">Paper</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-navy/10 bg-white px-3 text-sm font-bold text-charcoal outline-none focus:border-emerald"
              value={paper.id}
              onChange={(event) => switchPaper(event.target.value)}
            >
              {papers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-xs font-black uppercase text-charcoal/60">Auto-save</span>
            <div className="mt-2 flex h-11 items-center gap-2 rounded-md border border-navy/10 bg-white px-3 text-sm font-bold text-charcoal">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
              {hydrated ? formatSavedAt(attempt.updatedAt) : "Loading saved attempt"}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 rounded-md border border-navy/10 bg-white shadow-sm" data-testid="paper-viewer">
          <div className="flex flex-col gap-3 border-b border-navy/10 p-3 sm:p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-charcoal">Paper Viewer</h2>
              <p className="mt-1 text-sm font-semibold text-charcoal/60">{paper.pages} pages</p>
            </div>
            {paper.resourceUrl ? (
              <Link href={paper.resourceUrl} target="_blank" className="inline-flex items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-black text-emerald hover:border-emerald/40">
                Open original PDF
                <Icon name="download" className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <div className="bg-cool p-2 sm:p-3 md:p-5">
            <PdfViewer title={`${paper.title} PDF`} url={paper.resourceUrl} heightClassName="h-[70vh] min-h-[520px]" unavailableMessage="Original PDF is not available for this paper yet." />
          </div>
        </section>

        <aside className="space-y-3 md:space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-md border border-navy/10 bg-white p-3 shadow-sm sm:p-4" data-testid="answer-workspace" id="answer-workspace">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
                  <Icon name="clipboard-check" className="h-5 w-5 text-emerald" /> Answer Workspace
                </h2>
                <p className="mt-1 text-xs font-bold text-charcoal/60">70 MCQs plus one descriptive response.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {isReviewing ? (
                  <button className="rounded-md border border-navy/10 bg-white px-3 py-2 text-xs font-black text-charcoal hover:border-emerald/40" onClick={resumeAttempt} type="button">
                    Edit
                  </button>
                ) : null}
                <button className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600" onClick={resetAttempt} type="button">
                  Reset
                </button>
              </div>
            </div>

            {isReviewing ? (
              <div className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-3">
                <p className="text-sm font-black text-charcoal">Submitted {formatSavedAt(attempt.submittedAt)}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <ReviewStat label="Answered" value={`${answeredCount}/70`} />
                  <ReviewStat label="Verified" value={verifiedCount.toString()} />
                  <ReviewStat label="Correct" value={verifiedCount ? `${correctCount}/${verifiedCount}` : "-"} />
                </div>
                {unansweredCount > 0 ? <p className="mt-3 text-xs font-bold leading-5 text-charcoal/65">{unansweredCount} MCQs were left unanswered when you submitted.</p> : null}
                {verifiedCount === 0 ? <p className="mt-3 text-xs font-bold leading-5 text-charcoal/65">No verified answer key is attached to this paper yet, so review shows your choices without grading.</p> : null}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border border-navy/10 bg-white">
              <SectionButton active={section === "part-i"} label="Part I" count="1-20" onClick={() => setSection("part-i")} />
              <SectionButton active={section === "part-ii"} label="Part II" count="21-70" onClick={() => setSection("part-ii")} />
              <SectionButton active={section === "descriptive"} label="Descriptive" count="Long" onClick={() => setSection("descriptive")} />
            </div>

            {section === "descriptive" ? (
              <div className="mt-4 rounded-md border border-navy/10 bg-ivory p-3">
                <label className="text-sm font-black text-charcoal">Descriptive Response</label>
                <textarea
                  data-testid="descriptive-answer"
                  className="mt-3 min-h-80 w-full resize-y rounded-md border border-navy/10 bg-white p-4 text-sm leading-7 text-charcoal outline-none focus:border-emerald"
                  placeholder="Write your complete descriptive section response here..."
                  value={attempt.descriptiveAnswer}
                  disabled={isReviewing}
                  onChange={(event) => updateAttempt((previous) => ({ ...previous, descriptiveAnswer: event.target.value }))}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-charcoal/60">
                  <span>{descriptiveWordCount} words</span>
                  <span>{attempt.descriptiveAnswer.length.toLocaleString()} characters</span>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-black text-charcoal" htmlFor="past-paper-solution-upload">
                  Upload solution file
                  <input
                    id="past-paper-solution-upload"
                    type="file"
                    accept="application/pdf,image/*"
                    disabled={isReviewing}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      updateAttempt((previous) => ({ ...previous, descriptiveSolutionFileName: file?.name ?? "" }));
                    }}
                    className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-semibold normal-case text-charcoal file:mr-3 file:rounded-md file:border-0 file:bg-emerald file:px-3 file:py-2 file:text-sm file:font-black file:text-white disabled:opacity-60"
                  />
                </label>
                {attempt.descriptiveSolutionFileName ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald/20 bg-mint px-3 py-2 text-xs font-bold text-charcoal/70">
                    <span className="min-w-0 truncate">Selected: {attempt.descriptiveSolutionFileName}</span>
                    {!isReviewing ? (
                      <button
                        type="button"
                        className="font-black text-emerald underline"
                        onClick={() => updateAttempt((previous) => ({ ...previous, descriptiveSolutionFileName: "" }))}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-3 text-xs font-semibold leading-5 text-charcoal/60">Typed work is saved in this browser. Uploaded files stay on your device for now.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="no-scrollbar grid max-h-[620px] gap-2 overflow-y-auto pr-1">
                  {visibleNumbers.map((number) => (
                    <McqAnswerRow
                      key={number}
                      number={number}
                      answer={attempt.mcqAnswers[String(number)]}
                      active={attempt.activeQuestion === number}
                      review={isReviewing}
                      correctAnswer={answerKeyByQuestion.get(number) ?? null}
                      onFocus={() => focusQuestion(number)}
                      onChoose={(choice) => chooseAnswer(number, choice)}
                    />
                  ))}
                </div>
                <button
                  className="w-full rounded-md border border-navy/10 bg-white px-4 py-3 text-sm font-black text-charcoal hover:border-emerald/40 disabled:opacity-40"
                  onClick={clearCurrentMcq}
                  type="button"
                  disabled={isReviewing || !attempt.activeQuestion || !attempt.mcqAnswers[String(attempt.activeQuestion)]}
                >
                  Clear current MCQ
                </button>
              </div>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {isReviewing ? (
                <button className="rounded-md bg-navy px-4 py-3 text-sm font-black text-white" onClick={resumeAttempt} type="button">
                  Return to Editing
                </button>
              ) : (
                <button className="rounded-md bg-emerald px-4 py-3 text-sm font-black text-white" onClick={submitAttempt} type="button">
                  Submit & Review
                </button>
              )}
              <Link href="/past-papers" className="rounded-md border border-navy/10 bg-white px-4 py-3 text-center text-sm font-black text-charcoal hover:border-emerald/40">
                Save & Exit
              </Link>
            </div>
          </section>

          <section className="rounded-md border border-navy/10 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
              <Icon name="list-checks" className="h-5 w-5 text-emerald" /> MCQ Navigator
            </h2>
            <div className="mt-4 grid grid-cols-10 gap-1.5">
              {MCQ_NUMBERS.map((number) => {
                const answered = Boolean(attempt.mcqAnswers[String(number)]);
                const active = attempt.activeQuestion === number;
                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => {
                      setSection(number <= 20 ? "part-i" : "part-ii");
                      focusQuestion(number);
                    }}
                    className={cn(
                      "flex h-8 min-w-0 items-center justify-center rounded-md border text-[11px] font-black",
                      answered ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal",
                      active && "ring-2 ring-gold ring-offset-2",
                    )}
                    title={`Question ${number}`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-md border border-navy/10 bg-white p-4 shadow-sm" data-testid="desmos-scientific">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
                  <Icon name="calculator" className="h-5 w-5 text-emerald" /> Desmos Scientific
                </h2>
                <p className="mt-1 text-xs font-bold text-charcoal/60">Use the embedded scientific calculator for quick computations.</p>
              </div>
              <Link href="https://www.desmos.com/scientific" target="_blank" className="shrink-0 rounded-md border border-navy/10 px-3 py-2 text-xs font-black text-emerald hover:border-emerald/40">
                Open
              </Link>
            </div>
            <iframe
              className="mt-4 h-[360px] w-full rounded-md border border-navy/10 bg-white sm:h-[390px]"
              src="https://www.desmos.com/scientific?embed"
              title="Desmos scientific calculator"
              loading="lazy"
            />
          </section>

          {relatedPapers.length > 0 && (
            <section className="rounded-md border border-navy/10 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-black uppercase text-charcoal">Related {paper.subject} Papers</h2>
              <div className="mt-4 space-y-2">
                {relatedPapers.map((item) => (
                  <Link key={item.id} href={`/past-papers/${item.id}`} className="block rounded-md border border-navy/10 bg-ivory p-3 text-sm font-bold text-charcoal hover:text-emerald">
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy px-3 py-2 text-white shadow-2xl md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-2">
          <div className="text-center">
            <p className="text-xs font-black">{paper.subject} {paper.year}</p>
            <p className="text-[11px] text-white/70">{answeredCount}/70 answered</p>
          </div>
          <a href="#answer-workspace" className="rounded-md border border-white/15 px-3 py-2 text-xs font-black">
            Answers
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-navy/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/past-papers" className="rounded-md border border-navy/10 bg-white px-5 py-3 text-center text-sm font-black text-charcoal hover:border-emerald/40">
          Save & Exit
        </Link>
        <p className="text-sm font-bold text-charcoal/60">Saved locally for this browser. Open the same paper later to continue.</p>
      </div>
    </div>
  );
}

function SectionButton({ active, label, count, onClick }: { active: boolean; label: string; count: string; onClick: () => void }) {
  return (
    <button className={cn("px-2 py-3 text-center transition", active ? "bg-emerald text-white" : "bg-white text-charcoal hover:bg-mint")} onClick={onClick} type="button">
      <span className="block text-sm font-black">{label}</span>
      <span className="mt-0.5 block text-[11px] font-bold opacity-75">{count}</span>
    </button>
  );
}

function McqAnswerRow({
  number,
  answer,
  active,
  review,
  correctAnswer,
  onFocus,
  onChoose,
}: {
  number: number;
  answer: AnswerChoice | null;
  active: boolean;
  review: boolean;
  correctAnswer: AnswerChoice | null;
  onFocus: () => void;
  onChoose: (choice: AnswerChoice) => void;
}) {
  const isCorrect = review && correctAnswer !== null && answer === correctAnswer;
  const isIncorrect = review && correctAnswer !== null && Boolean(answer) && answer !== correctAnswer;
  return (
    <div
      className={cn(
        "rounded-md border p-2 transition",
        active ? "border-gold bg-gold/10" : "border-navy/10 bg-white",
        isCorrect && "border-emerald bg-mint",
        isIncorrect && "border-red-300 bg-red-50",
      )}
      data-testid={`mcq-row-${number}`}
    >
      <button className="mb-2 flex w-full items-center justify-between text-left" onClick={onFocus} type="button">
        <span className="text-sm font-black text-charcoal">Q{number}</span>
        <span className="text-[11px] font-bold text-charcoal/45">{review ? (correctAnswer ? `Key: ${correctAnswer}` : "Key pending") : "Select"}</span>
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {CHOICES.map((choice) => (
          <button
            key={`${number}-${choice}`}
            data-testid={`mcq-${number}-${choice}`}
            type="button"
            onClick={() => onChoose(choice)}
            disabled={review}
            className={cn(
              "h-9 rounded-md border text-sm font-black transition",
              answer === choice ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-ivory text-charcoal hover:border-emerald/40",
              review && correctAnswer === choice && "border-emerald bg-mint text-emerald",
              review && answer === choice && answer !== correctAnswer && correctAnswer !== null && "border-red-400 bg-red-100 text-red-700",
              review && answer === choice && correctAnswer === null && "border-gold bg-gold/20 text-charcoal",
              review && "cursor-default hover:border-navy/10",
            )}
            aria-pressed={answer === choice}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-navy/10 bg-white p-2">
      <p className="font-mono text-base font-black text-charcoal">{value}</p>
      <p className="text-[10px] font-black uppercase text-charcoal/55">{label}</p>
    </div>
  );
}
