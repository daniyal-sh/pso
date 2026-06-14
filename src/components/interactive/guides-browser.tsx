"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { GuidePreviewCard } from "@/components/sections/cards";
import type { Guide } from "@/lib/guides";
import { cn } from "@/lib/utils";
import { sortSubjects } from "@/lib/subjects";

export function GuidesBrowser({ guides }: { guides: Guide[] }) {
  const subjects = useMemo(() => ["All", ...sortSubjects(Array.from(new Set(guides.map((guide) => guide.category))))], [guides]);
  const [subject, setSubject] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Featured");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return guides
      .filter((guide) => subject === "All" || guide.category === subject)
      .filter((guide) => {
        if (!normalizedQuery) return true;
        return [guide.title, guide.description, guide.author, guide.category, ...guide.tags].join(" ").toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === "Latest") return b.updated.localeCompare(a.updated);
        if (sort === "Beginner first") return a.level.localeCompare(b.level);
        return Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title);
      });
  }, [guides, query, sort, subject]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1">
          {subjects.map((item) => (
            <button
              key={item}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition",
                item === subject ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal hover:border-emerald/30",
              )}
              type="button"
              onClick={() => setSubject(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
            <Icon name="search" className="h-4 w-4" />
            <input
              className="min-w-0 bg-transparent outline-none"
              placeholder="Search guides, topics, authors..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Featured</option>
            <option>Latest</option>
            <option>Beginner first</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((guide) => (
          <GuidePreviewCard key={guide.slug} guide={guide} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-6 rounded-md border border-dashed border-navy/20 bg-white p-8 text-center text-sm font-semibold text-charcoal/70">
          No guide matches that subject and search.
        </div>
      )}
    </div>
  );
}
