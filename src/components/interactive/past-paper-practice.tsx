"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import type { PastPaper, Question } from "@/lib/content-data";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function PastPaperPractice({ paper, questions, papers }: { paper: PastPaper; questions: Question[]; papers: PastPaper[] }) {
  const [seconds, setSeconds] = useState(Math.max(3600, questions.length * 90));
  const [paused, setPaused] = useState(false);
  const [section, setSection] = useState("Part I");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(new Set<string>());
  const [marked, setMarked] = useState(new Set<string>());
  const [showSolution, setShowSolution] = useState(false);
  const [scratchpad, setScratchpad] = useState("");
  const [hints, setHints] = useState(2);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  const sections = useMemo(
    () => [
      { key: "Part I", label: "Common MCQs", count: questions.filter((question) => question.section === "Part I").length },
      { key: "Part II", label: `${paper.subject} MCQs`, count: questions.filter((question) => question.section === "Part II").length },
      { key: "Part III", label: "Descriptive", count: questions.filter((question) => question.section === "Part III").length },
    ],
    [paper.subject, questions],
  );
  const sectionQuestions = useMemo(() => {
    const scoped = questions.filter((question) => question.section === section);
    return scoped.length ? scoped : questions;
  }, [questions, section]);
  const current = sectionQuestions[currentIndex] ?? sectionQuestions[0] ?? questions[0];
  const progress = questions.length ? Math.round((answered.size / questions.length) * 100) : 0;
  const relatedPapers = useMemo(() => papers.filter((item) => item.id !== paper.id && item.subject === paper.subject).slice(0, 4), [paper.id, paper.subject, papers]);

  function chooseAnswer(index: number) {
    if (!current) return;
    setSelected(index);
    setAnswered((previous) => new Set(previous).add(current.id));
    setShowSolution(false);
  }

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(sectionQuestions.length - 1, index)));
    setSelected(null);
    setShowSolution(false);
  }

  function toggleMark(id: string) {
    setMarked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!current) {
    return (
      <div className="card-surface rounded-md p-8 text-center">
        <h2 className="font-display text-3xl font-bold text-charcoal">No extracted questions yet</h2>
        <p className="mt-2 text-charcoal/70">This paper is available as a resource, but question extraction did not produce reviewable items.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-md p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.8fr_0.7fr]">
          <label>
            <span className="text-xs font-black uppercase text-charcoal">Paper</span>
            <select
              className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-3 text-sm font-bold text-charcoal"
              value={paper.id}
              onChange={(event) => {
                window.location.href = `/past-papers/${event.target.value}`;
              }}
            >
              {papers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <InfoBox label="Time Remaining" value={formatTime(seconds)} icon="timer" action={() => setPaused((value) => !value)} />
          <InfoBox label="Progress" value={`${answered.size} / ${questions.length}`} icon="clipboard-check" />
          <div>
            <span className="text-xs font-black uppercase text-charcoal">Mode</span>
            <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-navy/10">
              <button className="bg-emerald px-3 py-3 text-sm font-black text-white" type="button">
                Practice
              </button>
              <button className="bg-white px-3 py-3 text-sm font-black text-charcoal" type="button">
                Review
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-cool">
          <div className="h-2 rounded-full bg-emerald" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {sections.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setSection(item.key);
                setCurrentIndex(0);
                setSelected(null);
                setShowSolution(false);
              }}
              className={cn(
                "rounded-md border px-4 py-3 text-left transition",
                section === item.key ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal",
              )}
            >
              <span className="text-sm font-black">{item.label}</span>
              <span className="mt-1 block text-xs font-bold opacity-70">{item.count} questions</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <section className="card-surface rounded-md">
          <div className="flex flex-wrap items-center gap-3 border-b border-navy/10 p-5">
            <Badge>Question {current.displayNumber ?? current.number}</Badge>
            <span className="text-sm font-bold text-charcoal/70">{current.sectionTitle}</span>
            <span className="text-sm font-bold text-charcoal/70">{current.type}</span>
            <span className="text-sm font-bold text-charcoal/70">{current.difficulty}</span>
            <span className="text-sm font-bold text-charcoal/70">Page {current.page ?? "n/a"}</span>
            <button className="ml-auto flex items-center gap-2 text-sm font-black text-charcoal" onClick={() => toggleMark(current.id)} type="button">
              <Icon name="bookmark" className={cn("h-4 w-4", marked.has(current.id) && "text-gold")} />
              Mark for Review
            </button>
          </div>
          <div className="p-6">
            <p className="whitespace-pre-wrap text-lg font-medium leading-8 text-charcoal">{current.prompt}</p>
            {current.figure && (
              <div className="my-6 rounded-md border border-navy/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-sm font-black text-charcoal">
                  <span>Diagram</span>
                  {paper.resourceUrl && (
                    <Link href={paper.resourceUrl} className="text-emerald" target="_blank">
                      Open PDF
                    </Link>
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.figure} alt={`Diagram for question ${current.number}`} className="max-h-[720px] w-full rounded-md object-contain" />
              </div>
            )}
            {current.options.length > 0 ? (
              <div className="mt-5 space-y-3">
                {current.options.map((option, index) => (
                  <button
                    key={`${current.id}-${index}-${option}`}
                    onClick={() => chooseAnswer(index)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-4 rounded-md border px-5 text-left font-bold transition",
                      selected === index ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal",
                    )}
                    type="button"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/15 text-sm">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-navy/10 bg-white p-4">
                <label className="text-sm font-black text-charcoal">Answer Area</label>
                <textarea className="mt-3 min-h-36 w-full rounded-md border border-navy/10 p-4 outline-none focus:border-emerald" placeholder="Write your descriptive solution..." />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-navy/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/past-papers" className="rounded-md border border-navy/10 bg-white px-5 py-3 text-center text-sm font-black text-charcoal">
              Save & Exit
            </Link>
            <button className="rounded-md border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600" onClick={() => setSelected(null)} type="button">
              Clear Answer
            </button>
            <div className="flex gap-3 sm:ml-auto">
              <button className="rounded-md border border-navy/10 bg-white px-5 py-3 text-sm font-black text-charcoal" onClick={() => goTo(currentIndex - 1)} type="button">
                Previous
              </button>
              <button className="rounded-md bg-emerald px-5 py-3 text-sm font-black text-white" onClick={() => goTo(currentIndex + 1)} type="button">
                Next Question
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card-surface rounded-md p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
              <Icon name="calculator" className="h-5 w-5 text-emerald" /> Question Navigator
            </h2>
            <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-10">
              {sectionQuestions.map((question, index) => {
                const isAnswered = answered.has(question.id);
                const isCurrent = question.id === current.id;
                return (
                  <button
                    key={`${question.id}-${index}`}
                    onClick={() => goTo(index)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md border text-sm font-black",
                      isAnswered ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal",
                      isCurrent && "ring-2 ring-emerald ring-offset-2",
                      marked.has(question.id) && "border-gold bg-gold/20 text-charcoal",
                    )}
                    type="button"
                  >
                    {marked.has(question.id) ? <Icon name="star" className="h-4 w-4" /> : question.displayNumber ?? question.number}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-surface rounded-md p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
              <Icon name="pen" className="h-5 w-5 text-navy" /> Scratchpad
            </h2>
            <textarea
              className="mt-4 min-h-36 w-full resize-none rounded-md border border-navy/10 bg-white p-4 text-sm outline-none focus:border-emerald"
              placeholder="Write, calculate, or draft a proof..."
              value={scratchpad}
              onChange={(event) => setScratchpad(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ToolButton icon="lightbulb" title="Hints" meta={`${hints} left`} onClick={() => setHints((value) => Math.max(0, value - 1))} />
            <ToolButton icon="book-open" title="Formula Sheet" meta="Open" />
            <ToolButton icon="calculator" title="Calculator" meta="Open" />
          </div>

          <div className="rounded-md border border-navy/10 bg-gradient-to-br from-white to-mint p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
              <Icon name="eye" className="h-5 w-5 text-navy" /> View Solution
            </h2>
            {showSolution ? (
              <p className="mt-3 text-sm leading-7 text-charcoal/80">{current.solution || "No reviewed solution is attached to this extracted item yet. The admin workflow can add official or contributor explanations."}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-charcoal/70">Reveal the solution panel after attempting the problem.</p>
                <button className="rounded-md bg-emerald px-4 py-2.5 text-sm font-black text-white" onClick={() => setShowSolution(true)} type="button">
                  Reveal Solution
                </button>
              </div>
            )}
          </div>

          {relatedPapers.length > 0 && (
            <div className="card-surface rounded-md p-5">
              <h2 className="text-sm font-black uppercase text-charcoal">Related {paper.subject} Papers</h2>
              <div className="mt-4 space-y-2">
                {relatedPapers.map((item) => (
                  <Link key={item.id} href={`/past-papers/${item.id}`} className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon, action }: { label: string; value: string; icon: string; action?: () => void }) {
  return (
    <div className="rounded-md border border-navy/10 bg-white p-4">
      <p className="text-xs font-black uppercase text-charcoal/60">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <Icon name={icon} className="h-6 w-6 text-navy" />
        <span className="font-mono text-2xl font-black text-charcoal">{value}</span>
        {action && (
          <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-md bg-mint text-emerald" onClick={action} type="button" aria-label="Pause timer">
            <Icon name="pause" className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ToolButton({ icon, title, meta, onClick }: { icon: string; title: string; meta: string; onClick?: () => void }) {
  return (
    <button className="card-surface rounded-md p-4 text-left" onClick={onClick} type="button">
      <Icon name={icon} className="h-6 w-6 text-navy" />
      <p className="mt-2 text-sm font-black text-charcoal">{title}</p>
      <p className="text-xs font-bold text-emerald">{meta}</p>
    </button>
  );
}
