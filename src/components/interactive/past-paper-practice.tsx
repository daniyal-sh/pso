"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import { pastPaperQuestion } from "@/lib/data";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function PastPaperPractice() {
  const [seconds, setSeconds] = useState(6088);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(13);
  const [selected, setSelected] = useState<number | null>(1);
  const [marked, setMarked] = useState(new Set([18]));
  const [showSolution, setShowSolution] = useState(false);
  const [scratchpad, setScratchpad] = useState("");
  const [hints, setHints] = useState(2);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  const answered = useMemo(() => new Set(Array.from({ length: 12 }, (_, index) => index + 1)), []);

  function toggleMark(questionNumber: number) {
    setMarked((previous) => {
      const next = new Set(previous);
      if (next.has(questionNumber)) next.delete(questionNumber);
      else next.add(questionNumber);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-md p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.8fr_0.7fr]">
          <label>
            <span className="text-xs font-black uppercase text-charcoal">Exam</span>
            <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-3 text-sm font-bold text-charcoal">
              <option>NSTC (National Science Talent Contest)</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase text-charcoal">Year</span>
            <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-3 text-sm font-bold text-charcoal">
              <option>2023</option>
              <option>2022</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase text-charcoal">Subject</span>
            <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-3 text-sm font-bold text-charcoal">
              <option>Physics</option>
              <option>Chemistry</option>
            </select>
          </label>
          <div>
            <span className="text-xs font-black uppercase text-charcoal">Mode</span>
            <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-navy/10">
              <button className="bg-emerald px-3 py-3 text-sm font-black text-white" type="button">
                Practice
              </button>
              <button className="bg-white px-3 py-3 text-sm font-black text-charcoal" type="button">
                Exam Simulation
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
          <div className="rounded-md border border-navy/10 bg-white p-4">
            <p className="text-xs font-black uppercase text-charcoal/60">Time Remaining</p>
            <div className="mt-2 flex items-center gap-3">
              <Icon name="timer" className="h-6 w-6 text-navy" />
              <span className="font-mono text-3xl font-black text-charcoal">{formatTime(seconds)}</span>
              <button
                className="ml-auto flex h-10 w-10 items-center justify-center rounded-md bg-mint text-emerald"
                onClick={() => setPaused((value) => !value)}
                type="button"
                aria-label="Pause timer"
              >
                <Icon name="pause" className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="rounded-md border border-navy/10 bg-white p-4">
            <p className="text-xs font-black uppercase text-charcoal/60">Progress</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-lg font-black text-charcoal">12 / 40 Questions</span>
              <span className="text-sm font-black text-emerald">30%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-cool">
              <div className="h-2 w-[30%] rounded-full bg-emerald" />
            </div>
          </div>
          <div className="rounded-md border border-navy/10 bg-white p-4">
            <p className="text-xs font-black uppercase text-charcoal/60">Session</p>
            <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
              <span><b className="text-charcoal">12</b><br />Attempted</span>
              <span><b className="text-charcoal">75%</b><br />Accuracy</span>
              <span><b className="text-charcoal">Auto</b><br />Save</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <section className="card-surface rounded-md">
          <div className="flex flex-wrap items-center gap-3 border-b border-navy/10 p-5">
            <Badge>Question {current}</Badge>
            <span className="text-sm font-bold text-charcoal/70">{pastPaperQuestion.difficulty}</span>
            <span className="text-sm font-bold text-charcoal/70">{pastPaperQuestion.marks} Marks</span>
            <span className="text-sm font-bold text-charcoal/70">{pastPaperQuestion.type}</span>
            <button className="ml-auto flex items-center gap-2 text-sm font-black text-charcoal" onClick={() => toggleMark(current)} type="button">
              <Icon name="bookmark" className={cn("h-4 w-4", marked.has(current) && "text-gold")} />
              Mark for Review
            </button>
          </div>
          <div className="p-6">
            <p className="text-lg font-medium leading-8 text-charcoal">{pastPaperQuestion.prompt}</p>
            <div className="my-8 flex min-h-56 items-center justify-center rounded-md bg-white">
              <div className="relative h-52 w-full max-w-md">
                <div className="absolute bottom-10 left-16 h-32 border-l-4 border-charcoal/80" />
                <div className="absolute bottom-10 left-16 h-px w-64 border-t-4 border-dashed border-charcoal/50" />
                <div className="absolute bottom-10 left-16 h-1 w-72 origin-left -rotate-[28deg] bg-charcoal/80" />
                <div className="absolute bottom-[150px] left-20 h-12 w-12 rounded-full border-2 border-charcoal/70 bg-gradient-to-br from-white to-cool shadow-lg" />
                <span className="absolute bottom-20 left-8 font-black text-charcoal">H</span>
                <span className="absolute bottom-12 right-20 font-black text-charcoal">theta</span>
              </div>
            </div>
            <p className="text-lg font-medium leading-8 text-charcoal">{pastPaperQuestion.ask}</p>
            <div className="mt-5 space-y-3">
              {pastPaperQuestion.options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelected(index);
                    setShowSolution(false);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-4 rounded-md border px-5 text-left font-bold transition",
                    selected === index ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal",
                  )}
                  type="button"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/15 text-sm">{String.fromCharCode(65 + index)}</span>
                  <span className="font-mono text-base">{option}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-navy/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <button className="rounded-md border border-navy/10 bg-white px-5 py-3 text-sm font-black text-charcoal" type="button">
              Save & Exit
            </button>
            <button className="rounded-md border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600" onClick={() => setSelected(null)} type="button">
              Clear Answer
            </button>
            <div className="flex gap-3 sm:ml-auto">
              <button className="rounded-md border border-navy/10 bg-white px-5 py-3 text-sm font-black text-charcoal" onClick={() => setCurrent(Math.max(1, current - 1))} type="button">
                Previous
              </button>
              <button className="rounded-md bg-emerald px-5 py-3 text-sm font-black text-white" onClick={() => setCurrent(Math.min(40, current + 1))} type="button">
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
            <div className="mt-4 grid grid-cols-10 gap-2">
              {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => {
                const isAnswered = answered.has(number);
                const isCurrent = number === current;
                return (
                  <button
                    key={number}
                    onClick={() => setCurrent(number)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md border text-sm font-black",
                      isAnswered ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal",
                      isCurrent && "ring-2 ring-emerald ring-offset-2",
                      marked.has(number) && "border-gold bg-gold/20 text-charcoal",
                    )}
                    type="button"
                  >
                    {marked.has(number) ? <Icon name="star" className="h-4 w-4" /> : number}
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
              placeholder="Write, draw, or calculate..."
              value={scratchpad}
              onChange={(event) => setScratchpad(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button className="card-surface rounded-md p-4 text-left" onClick={() => setHints((value) => Math.max(0, value - 1))} type="button">
              <Icon name="lightbulb" className="h-6 w-6 text-navy" />
              <p className="mt-2 text-sm font-black text-charcoal">Hints</p>
              <p className="text-xs font-bold text-emerald">{hints} left</p>
            </button>
            <button className="card-surface rounded-md p-4 text-left" type="button">
              <Icon name="book-open" className="h-6 w-6 text-navy" />
              <p className="mt-2 text-sm font-black text-charcoal">Formula Sheet</p>
              <p className="text-xs font-bold text-emerald">View</p>
            </button>
            <button className="card-surface rounded-md p-4 text-left" type="button">
              <Icon name="calculator" className="h-6 w-6 text-navy" />
              <p className="mt-2 text-sm font-black text-charcoal">Calculator</p>
              <p className="text-xs font-bold text-emerald">Open</p>
            </button>
          </div>

          <div className="rounded-md border border-navy/10 bg-gradient-to-br from-white to-mint p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
              <Icon name="eye" className="h-5 w-5 text-navy" /> View Solution
            </h2>
            {showSolution ? (
              <p className="mt-3 text-sm leading-7 text-charcoal/80">{pastPaperQuestion.solution}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-charcoal/70">{selected === null ? "Answer the question to unlock the solution." : "Solution is ready to reveal."}</p>
                <button
                  className="rounded-md bg-emerald px-4 py-2.5 text-sm font-black text-white disabled:bg-cool disabled:text-charcoal/60"
                  disabled={selected === null}
                  onClick={() => setShowSolution(true)}
                  type="button"
                >
                  Reveal Solution
                </button>
              </div>
            )}
          </div>

          <div className="rounded-md border border-emerald/15 bg-mint p-4 text-sm font-bold text-charcoal">
            Tip: Use the formula sheet and hints wisely to improve your score.
          </div>
        </aside>
      </div>
    </div>
  );
}
