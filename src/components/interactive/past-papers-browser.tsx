"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import type { PastPaper } from "@/lib/content-data";
import { cn } from "@/lib/utils";

const subjects = ["All", "Physics", "Chemistry", "Mathematics", "Biology"];

export function PastPapersBrowser({ papers }: { papers: PastPaper[] }) {
  const [subject, setSubject] = useState("All");
  const [year, setYear] = useState("All");

  const years = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => String(paper.year)))).sort().reverse()], [papers]);
  const filtered = useMemo(() => {
    return papers.filter((paper) => (subject === "All" || paper.subject === subject) && (year === "All" || String(paper.year) === year));
  }, [papers, subject, year]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {subjects.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSubject(item)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
                subject === item ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal hover:border-emerald/30",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <select className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal" value={year} onChange={(event) => setYear(event.target.value)}>
          {years.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((paper) => (
          <Link key={paper.id} href={`/past-papers/${paper.id}`} className="card-surface group rounded-md p-5 transition hover:-translate-y-1">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-mint text-emerald">
                <Icon name={paper.subject === "Mathematics" ? "pi" : paper.subject === "Chemistry" ? "flask" : paper.subject === "Biology" ? "dna" : "atom"} className="h-6 w-6" />
              </span>
              <Badge>{paper.year}</Badge>
            </div>
            <h2 className="mt-4 text-lg font-black text-charcoal">{paper.title}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-charcoal/60">
              <span>{paper.pages} pages</span>
              <span>{paper.mcqCount} MCQs</span>
              <span>{paper.partICount} common</span>
              <span>{paper.partIICount} subject</span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-black text-emerald">
              Practice paper
              <Icon name="chevron" className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
