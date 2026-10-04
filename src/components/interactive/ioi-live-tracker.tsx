"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { IoiDayResult, IoiLiveSnapshot, IoiParticipantResult, IoiProblem } from "@/lib/ioi-live-types";

const REFRESH_INTERVAL = 15_000;

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function initialDay(snapshot: IoiLiveSnapshot) {
  return snapshot.days.find((day) => day.status === "live")?.id
    ?? [...snapshot.days].reverse().find((day) => day.status === "complete")?.id
    ?? "day1";
}

function timerParts(day: IoiDayResult, now: number) {
  const start = new Date(day.begin).getTime();
  const end = new Date(day.end).getTime();
  const target = now < start ? start : end;
  const remaining = Math.max(0, target - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    label: now < start ? "Starts in" : now < end ? "Time remaining" : "Contest complete",
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: now >= end,
  };
}

export function IoiLiveTracker({ initialSnapshot }: { initialSnapshot: IoiLiveSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedDay, setSelectedDay] = useState<"day1" | "day2">(() => initialDay(initialSnapshot));
  const [connection, setConnection] = useState<"live" | "reconnecting">("live");

  // Once both contest days are over the results are final, so stop polling.
  const finished = snapshot.days.every((item) => item.status === "complete" && item.problems.length > 0);

  useEffect(() => {
    if (finished) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ioi-live", { cache: "no-store" });
        if (!response.ok) throw new Error("Refresh failed");
        const next = await response.json() as IoiLiveSnapshot;
        if (active) {
          setSnapshot(next);
          setConnection("live");
        }
      } catch {
        if (active) setConnection("reconnecting");
      }
    };
    const interval = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [finished]);

  const day = snapshot.days.find((item) => item.id === selectedDay) ?? snapshot.days[0];

  return (
    <>
      <section className="dark-panel science-field border-b border-white/10 text-white">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.14em]">
              <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5", connection === "live" ? "border-emerald-300/25 bg-emerald/25 text-emerald-100" : "border-gold/30 bg-gold/10 text-gold")}>
                <span className={cn("h-2 w-2 rounded-full", connection === "live" ? "animate-pulse bg-emerald-300" : "bg-gold")} />
                {connection === "live" ? "Live official feed" : "Reconnecting"}
              </span>
              <span className="text-white/55">Tashkent, Uzbekistan</span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-none text-white sm:text-5xl lg:text-6xl">IOI 2026 live results</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">Follow Pakistan’s four contestants across both five-hour competition days.</p>
          </div>
          <ContestTimer day={day} initialNow={snapshot.generatedAt} />
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-md border border-navy/10 bg-white p-1 shadow-sm" role="tablist" aria-label="Competition day">
              {snapshot.days.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedDay === item.id}
                  onClick={() => setSelectedDay(item.id)}
                  className={cn("min-h-10 rounded px-4 text-sm font-black transition", selectedDay === item.id ? "bg-emerald text-white" : "text-charcoal/65 hover:bg-mint hover:text-emerald")}
                >
                  {item.label} <span className="ml-1 font-semibold opacity-70">· {item.dateLabel}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <a href={snapshot.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-emerald hover:underline">
                Official IOI team results <Icon name="external-link" className="h-4 w-4" />
              </a>
              <a
                href="https://ioi-2026-country-board.chickenbiryani0609.chatgpt.site/?country=PAK&compare=IND"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-charcoal/60 transition hover:text-emerald hover:underline"
              >
                Pakistan vs India country board <Icon name="external-link" className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-5 grid overflow-hidden border border-navy/10 bg-white md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="flex items-center gap-4 p-5 sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-lg font-black text-white">PK</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald">Team Pakistan</p>
                <h2 className="font-display text-3xl font-bold text-charcoal">{day.label} standings</h2>
              </div>
            </div>
            <Metric label="Country rank" value={day.pakistanCountryRank ? `#${day.pakistanCountryRank}` : "—"} detail={day.countryCount ? `of ${day.countryCount} countries` : "Published when scoring opens"} />
            <Metric label="Team score" value={formatScore(day.pakistanScore)} detail={`${day.problems.length || 3} problems · four contestants`} />
          </div>

          {day.problems.length ? (
            <ResultsTable day={day} />
          ) : (
            <div className="soft-grid mt-5 border border-navy/10 bg-mint/50 px-5 py-12 text-center">
              <Icon name="timer" className="mx-auto h-8 w-8 text-emerald" />
              <h2 className="mt-3 font-display text-3xl font-bold text-charcoal">Day 2 scores will appear here</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-charcoal/65">The tracker will pick up the official problems, submissions, ranks, and country totals automatically when the second contest feed opens.</p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 text-xs font-semibold text-charcoal/55 sm:flex-row sm:items-center sm:justify-between">
            <p>Ranks are calculated from the official live scores. Country rank is the sum of all contestants for each country.</p>
            <p className="font-mono">Updated {new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function ContestTimer({ day, initialNow }: { day: IoiDayResult; initialNow: string }) {
  const [now, setNow] = useState(() => new Date(initialNow).getTime());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = timerParts(day, now);
  return (
    <div className="min-w-[280px] border-l border-white/10 pl-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gold">{countdown.label}</p>
      {countdown.isComplete ? (
        <p className="mt-2 font-display text-3xl font-bold text-white">Results recorded</p>
      ) : (
        <div className="mt-2 flex items-end gap-2 font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
          <TimeUnit value={countdown.hours} label="hrs" />
          <span className="pb-5 text-gold/60">:</span>
          <TimeUnit value={countdown.minutes} label="min" />
          <span className="pb-5 text-gold/60">:</span>
          <TimeUnit value={countdown.seconds} label="sec" />
        </div>
      )}
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return <span className="flex flex-col"><span>{String(value).padStart(2, "0")}</span><span className="mt-1 text-center font-sans text-[10px] font-black uppercase tracking-wider text-white/45">{label}</span></span>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-t border-navy/10 p-5 md:border-l md:border-t-0 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-charcoal/50">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-emerald">{value}</p>
      <p className="mt-1 text-xs font-semibold text-charcoal/55">{detail}</p>
    </div>
  );
}

function ResultsTable({ day }: { day: IoiDayResult }) {
  const [selected, setSelected] = useState<{ participantId: string; problemId: string } | null>(null);
  const selectedParticipant = day.participants.find((participant) => participant.id === selected?.participantId);
  const selectedProblem = day.problems.find((problem) => problem.id === selected?.problemId);
  const selectedResult = selectedParticipant?.problems.find((result) => result.problemId === selected?.problemId);

  return (
    <>
      <div className="mt-5 overflow-hidden border border-navy/10 bg-white">
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-navy/[0.035] text-xs font-black uppercase tracking-[0.1em] text-charcoal/50">
            <tr>
              <th className="px-5 py-4">Contestant</th>
              <th className="px-3 py-4 text-center">World rank</th>
              {day.problems.map((problem) => <th key={problem.id} className="px-3 py-4 text-center" title={problem.name}>{problem.shortName}</th>)}
              <th className="px-5 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {day.participants.map((participant) => (
              <tr key={participant.id} className="transition hover:bg-mint/35">
                <td className="px-5 py-5"><p className="font-black text-charcoal">{participant.name}</p><p className="mt-1 font-mono text-[11px] font-bold text-charcoal/40">{participant.id}</p></td>
                <td className="px-3 py-5 text-center font-mono text-sm font-black tabular-nums text-charcoal">#{participant.rank}</td>
                {participant.problems.map((problem) => (
                  <ProblemScore
                    key={problem.problemId}
                    result={problem}
                    participantName={participant.name}
                    problemName={day.problems.find((item) => item.id === problem.problemId)?.name ?? problem.problemId}
                    onSelect={() => setSelected({ participantId: participant.id, problemId: problem.problemId })}
                  />
                ))}
                <td className="px-5 py-5 text-right font-mono text-xl font-black tabular-nums text-emerald">{formatScore(participant.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="divide-y divide-navy/10 md:hidden">
        {day.participants.map((participant) => (
          <article key={participant.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-black text-charcoal">{participant.name}</h3><p className="mt-1 text-xs font-bold text-charcoal/50">World rank <span className="font-mono text-charcoal">#{participant.rank}</span></p></div>
              <div className="text-right"><p className="font-mono text-2xl font-black text-emerald">{formatScore(participant.score)}</p><p className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">total</p></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {participant.problems.map((problem) => {
                const meta = day.problems.find((item) => item.id === problem.problemId);
                return (
                  <button
                    key={problem.problemId}
                    type="button"
                    onClick={() => setSelected({ participantId: participant.id, problemId: problem.problemId })}
                    className="border border-navy/10 bg-ivory p-3 text-center transition hover:border-emerald/30 hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
                    aria-label={`View ${participant.name}'s ${meta?.name ?? problem.problemId} submissions`}
                  >
                    <p className="truncate text-[10px] font-black uppercase text-charcoal/45">{meta?.shortName}</p>
                    <p className="mt-1 font-mono text-lg font-black text-charcoal">{formatScore(problem.score)}</p>
                    <p className="mt-1 text-[10px] font-bold text-charcoal/45">{problem.submissions} {problem.submissions === 1 ? "submit" : "submits"} · view</p>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
        </div>
      </div>

      {selectedParticipant && selectedProblem && selectedResult ? (
        <SubmissionDialog
          day={day}
          participant={selectedParticipant}
          problem={selectedProblem}
          result={selectedResult}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function ProblemScore({
  result,
  participantName,
  problemName,
  onSelect,
}: {
  result: IoiParticipantResult["problems"][number];
  participantName: string;
  problemName: string;
  onSelect: () => void;
}) {
  return (
    <td className="px-3 py-5 text-center">
      <button
        type="button"
        onClick={onSelect}
        className="group min-w-20 rounded px-2 py-1 transition hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
        aria-label={`View ${participantName}'s ${problemName} submissions`}
      >
        <span className={cn("block font-mono text-base font-black tabular-nums", result.score >= 100 ? "text-emerald" : result.score > 0 ? "text-charcoal" : "text-charcoal/30")}>{formatScore(result.score)}</span>
        <span className="mt-1 block text-[10px] font-bold text-charcoal/40 group-hover:text-emerald">{result.submissions} {result.submissions === 1 ? "submit" : "submits"} · view</span>
      </button>
    </td>
  );
}

function SubmissionDialog({
  day,
  participant,
  problem,
  result,
  onClose,
}: {
  day: IoiDayResult;
  participant: IoiParticipantResult;
  problem: IoiProblem;
  result: IoiParticipantResult["problems"][number];
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const history = result.submissionHistory;
  const bestScore = history.reduce((best, submission) => Math.max(best, submission.score), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-ivory shadow-2xl sm:rounded-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-navy/10 bg-navy px-5 py-4 text-white sm:px-7 sm:py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-200">{participant.id} · {day.label} submission history</p>
            <h2 id="submission-dialog-title" className="mt-1 font-display text-2xl font-bold sm:text-3xl">{participant.name} · {problem.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-2xl leading-none text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Close submission history"
          >
            ×
          </button>
        </header>

        <div className="p-4 sm:p-7">
          <div className="grid grid-cols-3 overflow-hidden border border-navy/10 bg-white">
            <DialogMetric label="Submissions" value={String(history.length)} />
            <DialogMetric label="Best score" value={formatScore(bestScore)} />
            <DialogMetric label="Official score" value={formatScore(result.score)} />
          </div>

          {history.length ? (
            <>
              <div className="mt-5 border border-navy/10 bg-white p-3 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-charcoal/50">Score over contest time</p>
                    <p className="mt-1 text-xs font-semibold text-charcoal/55">Each dot is a submission; the green line tracks the best score reached.</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-charcoal/50">
                    <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 bg-emerald" /> Best score</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold ring-2 ring-navy" /> Submission</span>
                  </div>
                </div>
                <SubmissionChart day={day} problem={problem} result={result} />
              </div>

              <div className="mt-5 overflow-hidden border border-navy/10 bg-white">
                <div className="border-b border-navy/10 bg-navy/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-charcoal/50">All submissions</div>
                <div className="divide-y divide-navy/10">
                  {[...history].reverse().map((submission, reverseIndex) => {
                    const submissionNumber = history.length - reverseIndex;
                    return (
                      <div key={submission.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[120px_120px_90px_1fr] sm:items-center">
                        <div><p className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">Submission</p><p className="mt-1 font-mono text-sm font-black text-charcoal">#{String(submissionNumber).padStart(2, "0")}</p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">Contest time</p><p className="mt-1 font-mono text-sm font-black text-charcoal">{formatElapsed(submission.elapsedSeconds)}</p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">Score</p><p className={cn("mt-1 font-mono text-lg font-black", submission.score === bestScore && bestScore > 0 ? "text-emerald" : "text-charcoal")}>{formatScore(submission.score)}</p></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">Subtasks{submission.token ? " · token used" : ""}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {submission.subtasks.length ? submission.subtasks.map((score, index) => (
                              <span key={index} className={cn("rounded px-2 py-1 font-mono text-[11px] font-bold", score > 0 ? "bg-mint text-emerald" : "bg-navy/[0.045] text-charcoal/40")}>S{index}: {formatScore(score)}</span>
                            )) : <span className="text-xs font-semibold text-charcoal/40">Not published</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="soft-grid mt-5 border border-navy/10 bg-mint/45 px-5 py-12 text-center">
              <Icon name="activity" className="mx-auto h-8 w-8 text-emerald" />
              <h3 className="mt-3 font-display text-2xl font-bold text-charcoal">No submissions yet</h3>
              <p className="mt-2 text-sm font-semibold text-charcoal/55">This panel will update automatically when the official feed publishes a submission.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DialogMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-navy/10 px-3 py-4 first:border-l-0 sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-charcoal/45">{label}</p>
      <p className="mt-1 font-mono text-xl font-black tabular-nums text-emerald sm:text-2xl">{value}</p>
    </div>
  );
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function SubmissionChart({ day, problem, result }: { day: IoiDayResult; problem: IoiProblem; result: IoiParticipantResult["problems"][number] }) {
  const width = 720;
  const height = 250;
  const margin = { top: 16, right: 18, bottom: 38, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const duration = Math.max(1, (new Date(day.end).getTime() - new Date(day.begin).getTime()) / 1000);
  const maxScore = Math.max(1, problem.maxScore);
  const x = (seconds: number) => margin.left + Math.min(1, seconds / duration) * plotWidth;
  const y = (score: number) => margin.top + (1 - Math.min(1, Math.max(0, score) / maxScore)) * plotHeight;
  let runningBest = 0;
  let bestPath = `M ${margin.left} ${y(0)}`;
  result.submissionHistory.forEach((submission) => {
    runningBest = Math.max(runningBest, submission.score);
    bestPath += ` H ${x(submission.elapsedSeconds)} V ${y(runningBest)}`;
  });
  bestPath += ` H ${margin.left + plotWidth}`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${problem.name} submission scores over the five-hour contest`}>
      <title>{participantChartTitle(problem.name, result.submissionHistory.length)}</title>
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={margin.left + plotWidth} y1={y(maxScore * tick)} y2={y(maxScore * tick)} stroke="currentColor" className="text-navy/10" />
          <text x={margin.left - 9} y={y(maxScore * tick) + 4} textAnchor="end" className="fill-charcoal/45 font-mono text-[11px] font-bold">{formatScore(maxScore * tick)}</text>
        </g>
      ))}
      {xTicks.map((tick) => (
        <g key={tick}>
          <line x1={x(duration * tick)} x2={x(duration * tick)} y1={margin.top} y2={margin.top + plotHeight} stroke="currentColor" className="text-navy/[0.06]" />
          <text x={x(duration * tick)} y={height - 12} textAnchor="middle" className="fill-charcoal/45 font-mono text-[11px] font-bold">{Math.round((duration * tick) / 3600)}h</text>
        </g>
      ))}
      <path d={bestPath} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" className="text-emerald" />
      {result.submissionHistory.map((submission) => (
        <g key={submission.id}>
          <circle cx={x(submission.elapsedSeconds)} cy={y(submission.score)} r="6" className="fill-gold stroke-navy" strokeWidth="3" />
          <title>{formatElapsed(submission.elapsedSeconds)} · {formatScore(submission.score)} points</title>
        </g>
      ))}
    </svg>
  );
}

function participantChartTitle(problemName: string, submissions: number) {
  return `${problemName}: ${submissions} ${submissions === 1 ? "submission" : "submissions"}`;
}
