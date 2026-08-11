"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { IoiDayResult, IoiLiveSnapshot, IoiParticipantResult } from "@/lib/ioi-live-types";

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

  useEffect(() => {
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
  }, []);

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
            <a href={snapshot.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-emerald hover:underline">
              Official IOI team results <Icon name="external-link" className="h-4 w-4" />
            </a>
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
  return (
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
                {participant.problems.map((problem) => <ProblemScore key={problem.problemId} result={problem} />)}
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
                return <div key={problem.problemId} className="border border-navy/10 bg-ivory p-3 text-center"><p className="truncate text-[10px] font-black uppercase text-charcoal/45">{meta?.shortName}</p><p className="mt-1 font-mono text-lg font-black text-charcoal">{formatScore(problem.score)}</p><p className="mt-1 text-[10px] font-bold text-charcoal/45">{problem.submissions} {problem.submissions === 1 ? "submit" : "submits"}</p></div>;
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProblemScore({ result }: { result: IoiParticipantResult["problems"][number] }) {
  return (
    <td className="px-3 py-5 text-center">
      <p className={cn("font-mono text-base font-black tabular-nums", result.score >= 100 ? "text-emerald" : result.score > 0 ? "text-charcoal" : "text-charcoal/30")}>{formatScore(result.score)}</p>
      <p className="mt-1 text-[10px] font-bold text-charcoal/40">{result.submissions} {result.submissions === 1 ? "submit" : "submits"}</p>
    </td>
  );
}
