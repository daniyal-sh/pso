"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import type { Question } from "@/lib/content-data";
import { cn } from "@/lib/utils";

type PracticeMode = "Subject MCQs" | "Common MCQs" | "Descriptive";
type QuestionBankProgress = {
  version: 1;
  subject: string;
  mode: PracticeMode;
  shuffleSalt: number;
  activeIndex: number;
  answers: Record<string, number | null>;
  revealed: Record<string, boolean>;
  updatedAt: string | null;
};

const modes: { label: PracticeMode; section: string; icon: string; hint: string }[] = [
  { label: "Subject MCQs", section: "Part II", icon: "list-checks", hint: "NSTC Part II only" },
  { label: "Common MCQs", section: "Part I", icon: "star", hint: "NSTC Part I" },
  { label: "Descriptive", section: "Part III", icon: "book-open", hint: "Long-form paper questions" },
];

const QUESTION_BANK_STORAGE_KEY = "pso:question-bank-progress:v1";
const subjectOrder = ["Mathematics", "Physics", "Biology", "Chemistry"];

function sortSubjects(items: string[]) {
  return [...items].sort((a, b) => {
    const aIndex = subjectOrder.indexOf(a);
    const bIndex = subjectOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

function hashQuestion(id: string, salt: number) {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function subjectIcon(subject: string) {
  if (subject === "Mathematics") return "pi";
  if (subject === "Chemistry") return "flask";
  if (subject === "Biology") return "dna";
  return "atom";
}

function optionTone(question: Question, index: number, selectedAnswer: number | null) {
  if (selectedAnswer !== index) return "border-navy/10 bg-white text-charcoal hover:border-emerald/35";
  if (question.answer === null) return "border-emerald bg-mint text-emerald";
  return question.answer === index ? "border-emerald bg-mint text-emerald" : "border-red-300 bg-red-50 text-red-700";
}

function createInitialProgress(): QuestionBankProgress {
  return {
    version: 1,
    subject: "All",
    mode: "Subject MCQs",
    shuffleSalt: 17,
    activeIndex: 0,
    answers: {},
    revealed: {},
    updatedAt: null,
  };
}

function isPracticeMode(value: unknown): value is PracticeMode {
  return modes.some((item) => item.label === value);
}

function cleanAnswers(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, number | null] => {
      const answer = entry[1];
      return answer === null || (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer <= 3);
    }),
  );
}

function cleanRevealed(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
}

function normalizeProgress(value: unknown, subjects: string[]): QuestionBankProgress {
  const initial = createInitialProgress();
  if (!value || typeof value !== "object") return initial;
  const saved = value as Partial<QuestionBankProgress>;
  const mode = isPracticeMode(saved.mode) ? saved.mode : initial.mode;
  const subject = typeof saved.subject === "string" && (saved.subject === "All" || subjects.includes(saved.subject)) ? saved.subject : initial.subject;
  return {
    ...initial,
    subject: mode === "Common MCQs" ? "All" : subject,
    mode,
    shuffleSalt: Number.isFinite(saved.shuffleSalt) ? Number(saved.shuffleSalt) : initial.shuffleSalt,
    activeIndex: Number.isFinite(saved.activeIndex) ? Math.max(0, Math.floor(Number(saved.activeIndex))) : initial.activeIndex,
    answers: cleanAnswers(saved.answers),
    revealed: cleanRevealed(saved.revealed),
    updatedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : null,
  };
}

function formatSavedAt(value: string | null) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function QuestionBankClient({ questions }: { questions: Question[] }) {
  const subjects = useMemo(() => sortSubjects(Array.from(new Set(questions.map((question) => question.subject)))), [questions]);
  const [progress, setProgress] = useState<QuestionBankProgress>(() => createInitialProgress());
  const [hydrated, setHydrated] = useState(false);
  const { activeIndex, mode, shuffleSalt, subject } = progress;

  const activeMode = modes.find((item) => item.label === mode) ?? modes[0];
  const subjectCards = useMemo(() => {
    return subjects.map((item) => {
      const subjectQuestions = questions.filter((question) => question.subject === item);
      return {
        subject: item,
        subjectMcqs: subjectQuestions.filter((question) => question.section === "Part II").length,
        commonMcqs: subjectQuestions.filter((question) => question.section === "Part I").length,
        descriptive: subjectQuestions.filter((question) => question.section === "Part III").length,
      };
    });
  }, [questions, subjects]);

  const filtered = useMemo(() => {
    return questions
      .filter((question) => {
        const matchesMode = question.section === activeMode.section;
        const matchesSubject = mode === "Common MCQs" || subject === "All" || question.subject === subject;
        return matchesMode && matchesSubject;
      })
      .sort((a, b) => hashQuestion(a.id, shuffleSalt) - hashQuestion(b.id, shuffleSalt));
  }, [activeMode.section, mode, questions, shuffleSalt, subject]);

  const visibleActiveIndex = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;
  const active = filtered[visibleActiveIndex] ?? null;
  const selectedAnswer = active ? (progress.answers[active.id] ?? null) : null;
  const showSolution = active ? Boolean(progress.revealed[active.id]) : false;
  const answeredInFiltered = filtered.filter((question) => progress.answers[question.id] !== undefined && progress.answers[question.id] !== null).length;
  const revealedInFiltered = filtered.filter((question) => progress.revealed[question.id]).length;
  const progressPercent = filtered.length > 0 ? Math.round((answeredInFiltered / filtered.length) * 100) : 0;
  const progressLabel = answeredInFiltered > 0 && progressPercent === 0 ? "<1%" : `${progressPercent}%`;
  const progressBarWidth = answeredInFiltered > 0 ? Math.max(progressPercent, 1) : 0;
  const canGoBack = visibleActiveIndex > 0;
  const canGoNext = visibleActiveIndex < filtered.length - 1;

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
        setProgress(normalizeProgress(saved ? JSON.parse(saved) : null, subjects));
      } catch {
        setProgress(createInitialProgress());
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [subjects]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  function updateProgress(update: (previous: QuestionBankProgress) => QuestionBankProgress) {
    setProgress((previous) => ({ ...update(previous), updatedAt: new Date().toISOString() }));
  }

  function moveTo(index: number) {
    updateProgress((previous) => ({ ...previous, activeIndex: Math.max(0, Math.min(filtered.length - 1, index)) }));
  }

  function chooseMode(value: PracticeMode) {
    updateProgress((previous) => ({
      ...previous,
      mode: value,
      subject: value === "Common MCQs" ? "All" : previous.subject,
      activeIndex: 0,
    }));
  }

  function chooseSubject(value: string) {
    updateProgress((previous) => ({ ...previous, subject: value, activeIndex: 0 }));
  }

  function shuffleQuestions() {
    updateProgress((previous) => ({ ...previous, shuffleSalt: previous.shuffleSalt + 1, activeIndex: 0 }));
  }

  function resetPractice() {
    if (!window.confirm("Reset your saved question-bank progress in this browser?")) return;
    window.localStorage.removeItem(QUESTION_BANK_STORAGE_KEY);
    setProgress({ ...createInitialProgress(), updatedAt: new Date().toISOString() });
  }

  function chooseAnswer(index: number) {
    if (!active) return;
    updateProgress((previous) => ({
      ...previous,
      answers: { ...previous.answers, [active.id]: index },
    }));
  }

  function toggleSolution() {
    if (!active) return;
    updateProgress((previous) => ({
      ...previous,
      revealed: { ...previous.revealed, [active.id]: !previous.revealed[active.id] },
    }));
  }

  return (
    <div className="grid gap-4 sm:gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <div className="card-surface rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase text-charcoal">Practice Mode</h2>
              <p className="mt-1 text-xs font-semibold text-charcoal/60">NSTC past-paper questions only</p>
            </div>
            <button className="rounded-md border border-navy/10 bg-white px-3 py-2 text-xs font-black text-charcoal hover:border-emerald/40" type="button" onClick={resetPractice}>
              Reset
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {modes.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => chooseMode(item.label)}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-3 text-left transition",
                  mode === item.label ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal hover:border-emerald/35",
                )}
              >
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", mode === item.label ? "bg-white/15 text-white" : "bg-mint text-emerald")}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={cn("block text-xs font-semibold", mode === item.label ? "text-white/75" : "text-charcoal/55")}>{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase text-charcoal">Local Progress</h2>
              <p className="mt-1 text-xs font-semibold text-charcoal/60">Saved in this browser</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
          </div>
          <div className="mt-4 rounded-md border border-navy/10 bg-white px-3 py-3">
            <div className="flex items-center justify-between text-sm font-black text-charcoal">
              <span>{answeredInFiltered} answered</span>
              <span>{progressLabel}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-cool">
              <div className="h-2 rounded-full bg-emerald" style={{ width: `${progressBarWidth}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-charcoal/60">
              {hydrated ? `${formatSavedAt(progress.updatedAt)} | ${revealedInFiltered} revealed` : "Loading saved question-bank progress"}
            </p>
          </div>
        </div>

        <div className="card-surface rounded-md p-4">
          <h2 className="text-sm font-black uppercase text-charcoal">Subjects</h2>
          <div className="mt-4 grid gap-2">
            {mode !== "Common MCQs" && (
              <>
                <button
                  type="button"
                  onClick={() => chooseSubject("All")}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 text-sm font-black transition",
                    subject === "All" ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal hover:border-emerald/35",
                  )}
                >
                  All subjects
                  <span>{questions.filter((question) => question.section === activeMode.section).length}</span>
                </button>
                {subjectCards.map((card) => {
                  const visibleCount = mode === "Subject MCQs" ? card.subjectMcqs : card.descriptive;
                  return (
                    <button
                      key={card.subject}
                      type="button"
                      onClick={() => chooseSubject(card.subject)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                        subject === card.subject ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal hover:border-emerald/35",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2 font-black">
                        <Icon name={subjectIcon(card.subject)} className="h-4 w-4 shrink-0" />
                        <span className="truncate">{card.subject}</span>
                      </span>
                      <span className="font-black">{visibleCount}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-charcoal/60">Subject MCQs exclude Part I common MCQs. Use Common MCQs when you want the shared screening section.</p>
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="card-surface rounded-md p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald/20 bg-white">{mode}</Badge>
                <Badge className="border-gold/30 bg-gold/15 text-charcoal">{mode === "Common MCQs" || subject === "All" ? "All subjects" : subject}</Badge>
                <span className="text-sm font-bold text-charcoal/60">{filtered.length.toLocaleString()} questions in this drill</span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
                {mode === "Common MCQs" || subject === "All" ? mode : `${subject} ${mode}`}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-black text-charcoal disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
                disabled={!canGoBack}
                onClick={() => moveTo(visibleActiveIndex - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-black text-charcoal hover:border-emerald/40 sm:px-4"
                onClick={shuffleQuestions}
                type="button"
              >
                <Icon name="shuffle" className="h-4 w-4 text-gold" />
                Shuffle
              </button>
              <button
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-1 sm:px-4"
                disabled={!canGoNext}
                onClick={() => moveTo(visibleActiveIndex + 1)}
                type="button"
              >
                Next
                <Icon name="chevron" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {active ? (
          <article className="card-surface rounded-md p-4 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-4 border-b border-navy/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-emerald">
                  Question {visibleActiveIndex + 1} of {filtered.length}
                </p>
                <h3 className="mt-2 text-base font-black text-charcoal">{active.source}</h3>
                <p className="mt-1 text-sm font-semibold text-charcoal/60">
                  {active.sectionTitle} | Original number {active.displayNumber ?? active.number}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {[active.subject, active.topic, active.difficulty, active.type].filter(Boolean).map((tag, index) => (
                  <Badge key={`${tag}-${index}`} className="bg-white">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="py-7">
              <p className="whitespace-pre-wrap text-lg font-semibold leading-8 text-charcoal sm:text-2xl sm:leading-10">{active.prompt}</p>
              {active.figure && (
                <details className="mt-5 rounded-md border border-navy/10 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-black text-emerald">Show diagram</summary>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.figure} alt={`Diagram for question ${active.displayNumber ?? active.number}`} className="mt-4 w-full rounded-md border border-navy/10" />
                </details>
              )}
            </div>

            {active.options.length > 0 ? (
              <div className="grid gap-3">
                {active.options.map((option, index) => (
                  <button
                    key={`${active.id}-${index}-${option}`}
                    onClick={() => chooseAnswer(index)}
                    type="button"
                    className={cn("flex min-h-14 items-center gap-3 rounded-md border px-3 py-3 text-left text-sm font-bold leading-6 transition sm:gap-4 sm:px-4 sm:text-base", optionTone(active, index, selectedAnswer))}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy/5 text-sm font-black">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-navy/10 bg-white p-4 text-sm font-semibold text-charcoal/70">Write your solution separately, then reveal the available notes for checking.</div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-navy/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold leading-6 text-charcoal/65">{active.page ? `Source page ${active.page}` : active.source}</p>
              <button
                onClick={toggleSolution}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald px-5 py-2.5 text-sm font-black text-white sm:w-auto"
                type="button"
              >
                <Icon name="eye" className="h-4 w-4" />
                {showSolution ? "Hide Answer" : "Reveal Answer"}
              </button>
            </div>

            {showSolution && (
              <div className="mt-5 rounded-md border border-emerald/20 bg-mint p-5">
                <h3 className="font-black text-emerald">Answer</h3>
                <p className="mt-2 text-sm leading-7 text-charcoal/80">
                  {active.solution ||
                    (active.answer !== null
                      ? `Correct option: ${String.fromCharCode(65 + active.answer)}.`
                      : "No answer key is attached to this item yet. Use the source paper for final checking.")}
                </p>
              </div>
            )}
          </article>
        ) : (
          <div className="card-surface rounded-md p-8 text-center">
            <Icon name="list-checks" className="mx-auto h-10 w-10 text-emerald" />
            <h2 className="mt-4 font-display text-3xl font-bold text-charcoal">No questions in this drill</h2>
            <p className="mt-2 text-sm font-semibold text-charcoal/65">Try another subject or practice mode.</p>
          </div>
        )}
      </section>
    </div>
  );
}
