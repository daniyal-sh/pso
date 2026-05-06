"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import type { Question } from "@/lib/content-data";
import { cn } from "@/lib/utils";

const tabs = ["All Questions", "Common MCQs", "Subject MCQs", "Descriptive", "Problem Sets"];

export function QuestionBankClient({ questions }: { questions: Question[] }) {
  const subjects = useMemo(() => ["All", ...Array.from(new Set(questions.map((question) => question.subject))).sort()], [questions]);
  const years = useMemo(() => ["All", ...Array.from(new Set(questions.map((question) => String(question.year)))).sort()], [questions]);
  const exams = useMemo(() => ["All", ...Array.from(new Set(questions.map((question) => question.exam))).sort()], [questions]);
  const sections = useMemo(() => ["All", ...Array.from(new Set(questions.map((question) => question.section))).sort()], [questions]);
  const [subject, setSubject] = useState("All");
  const [section, setSection] = useState("All");
  const [year, setYear] = useState("All");
  const [exam, setExam] = useState("All");
  const [type, setType] = useState("All Questions");
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      const matchesSubject = subject === "All" || question.subject === subject;
      const matchesSection = section === "All" || question.section === section;
      const matchesYear = year === "All" || String(question.year) === year;
      const matchesExam = exam === "All" || question.exam === exam;
      const matchesType =
        type === "All Questions" ||
        (type === "Common MCQs" && question.section === "Part I") ||
        (type === "Subject MCQs" && question.section === "Part II") ||
        (type === "Descriptive" && question.section === "Part III") ||
        (type === "Problem Sets" && question.section === "Resource");
      const matchesQuery = !query.trim() || `${question.prompt} ${question.source} ${question.topic} ${question.sectionTitle}`.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesSection && matchesYear && matchesExam && matchesType && matchesQuery;
    });
  }, [exam, query, questions, section, subject, type, year]);

  const active = filtered[activeIndex] ?? filtered[0] ?? questions[0];
  const topicCards = useMemo(() => {
    const map = new Map<string, { subject: string; count: number; mcq: number; long: number }>();
    for (const question of questions) {
      const key = `${question.subject}:${question.topic}`;
      const current = map.get(key) ?? { subject: question.subject, count: 0, mcq: 0, long: 0 };
      current.count += 1;
      if (question.type === "MCQ") current.mcq += 1;
      else current.long += 1;
      map.set(key, current);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  }, [questions]);

  function moveTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(filtered.length - 1, index)));
    setSelectedAnswer(null);
    setShowSolution(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
      <aside className="card-surface rounded-md p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-charcoal">Filters</h2>
          <button
            className="text-xs font-black text-emerald"
            type="button"
            onClick={() => {
              setSubject("All");
              setSection("All");
              setYear("All");
              setExam("All");
              setType("All Questions");
              setQuery("");
            }}
          >
            Clear all
          </button>
        </div>
        <div className="space-y-5">
          <Select label="Subject" value={subject} values={subjects} onChange={setSubject} />
          <Select label="Section" value={section} values={sections} onChange={setSection} />
          <Select label="Exam" value={exam} values={exams} onChange={setExam} />
          <Select label="Year" value={year} values={years} onChange={setYear} />
          <label className="flex items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
            <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search prompts, topics, papers..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <Icon name="search" className="h-4 w-4" />
          </label>
          <div>
            <h3 className="text-sm font-bold text-charcoal">Available Content</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <Metric label="Questions" value={questions.length} />
              <Metric label="Visible" value={filtered.length} />
              <Metric label="MCQs" value={questions.filter((question) => question.type === "MCQ").length} />
              <Metric label="Long" value={questions.filter((question) => question.type === "Long").length} />
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        <div className="card-surface overflow-hidden rounded-md">
          <div className="grid border-b border-navy/10 sm:grid-cols-5">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setType(tab);
                  moveTo(0);
                }}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 border-r border-navy/10 px-3 text-sm font-black text-charcoal last:border-r-0",
                  type === tab && "bg-emerald text-white",
                )}
              >
                <Icon name={index === 0 ? "list-checks" : index === 3 ? "book-open" : "bookmark"} className="h-4 w-4" />
                {tab}
              </button>
            ))}
          </div>
          <div className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-charcoal/70">Showing {filtered.length.toLocaleString()} extracted questions</p>
              <div className="flex gap-2">
                <button className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-black text-charcoal" onClick={() => moveTo(activeIndex - 1)} type="button">
                  Previous
                </button>
                <button className="rounded-md bg-emerald px-3 py-2 text-sm font-black text-white" onClick={() => moveTo(activeIndex + 1)} type="button">
                  Next
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {topicCards.map(([key, value]) => (
                <button key={key} type="button" onClick={() => setSubject(value.subject)} className="rounded-md border border-navy/10 bg-white p-4 text-left transition hover:border-emerald/40 hover:bg-mint">
                  <Icon name={value.subject === "Mathematics" ? "pi" : value.subject === "Chemistry" ? "flask" : value.subject === "Biology" ? "dna" : "atom"} className="h-8 w-8 text-emerald" />
                  <h3 className="mt-3 font-black text-charcoal">{key.split(":")[1]}</h3>
                  <p className="text-sm text-charcoal/70">{value.subject}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-charcoal/70">
                    <span>{value.count} total</span>
                    <span>{value.mcq} MCQ</span>
                    <span>{value.long} long</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {active && (
          <div className="card-surface rounded-md p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-charcoal">Question {active.displayNumber ?? active.number}</h2>
              <span className="text-sm font-bold text-charcoal/60">{active.sectionTitle} - {active.source}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[active.subject, active.section, active.topic, active.difficulty, active.exam, String(active.year), active.type].map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-charcoal">{active.prompt}</p>
            {active.figure && (
              <details className="mt-4 rounded-md border border-navy/10 bg-white p-3">
                <summary className="cursor-pointer text-sm font-black text-emerald">Show diagram</summary>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.figure} alt={`Diagram for ${active.id}`} className="mt-3 w-full rounded-md border border-navy/10" />
              </details>
            )}
            {active.options.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {active.options.map((option, index) => (
                    <button
                    key={`${active.id}-${index}-${option}`}
                    onClick={() => setSelectedAnswer(index)}
                    type="button"
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md border px-4 text-left text-sm font-bold transition",
                      selectedAnswer === index ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal",
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/5 text-xs font-black">{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-charcoal/70">
                Extracted from {active.paperId ? `${active.sectionTitle} in a past paper` : "problem set content"}. Page {active.page ?? "n/a"}.
              </p>
              <button
                onClick={() => setShowSolution((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald px-5 py-2.5 text-sm font-black text-white"
                type="button"
              >
                <Icon name="eye" className="h-4 w-4" />
                {showSolution ? "Hide Solution" : "Reveal Solution"}
              </button>
            </div>
            {showSolution && (
              <div className="mt-5 rounded-md border border-emerald/20 bg-mint p-4">
                <h3 className="font-black text-emerald">Solution</h3>
                <p className="mt-2 text-sm leading-7 text-charcoal/80">
                  {active.solution || "No reviewed solution is attached to this extracted item yet. The prompt, section, options, page, and diagram crop are ready for contributor review."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="space-y-5">
        <div className="card-surface rounded-md p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
            <Icon name="sparkles" className="h-5 w-5 text-gold" /> Ingested Corpus
          </h2>
          <div className="mt-4 grid gap-3">
            {subjects.slice(1).map((item) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-navy/10 bg-white px-3 py-2">
                <span className="text-sm font-bold text-charcoal">{item}</span>
                <span className="text-sm font-black text-emerald">{questions.filter((question) => question.subject === item).length}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface rounded-md p-5">
          <h2 className="text-sm font-black uppercase text-charcoal">Contributor Workflow</h2>
          <div className="mt-4 space-y-3 text-sm text-charcoal/75">
            <p className="flex gap-2"><Icon name="check" className="h-5 w-5 text-emerald" /> Extracted questions are ready for review.</p>
            <p className="flex gap-2"><Icon name="check" className="h-5 w-5 text-emerald" /> Diagram crops are attached only where a question needs them.</p>
            <p className="flex gap-2"><Icon name="check" className="h-5 w-5 text-emerald" /> Solutions can be added by admins.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-charcoal">{label}</span>
      <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-semibold text-charcoal" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-navy/10 bg-white p-3">
      <div className="text-xl font-black text-emerald">{value.toLocaleString()}</div>
      <div className="text-xs font-bold text-charcoal/60">{label}</div>
    </div>
  );
}
