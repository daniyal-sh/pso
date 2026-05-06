"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import { formatBytes, type ResourceItem } from "@/lib/content-data";
import { cn } from "@/lib/utils";

const subjects = ["All", "General", "Physics", "Astronomy", "Chemistry", "Biology", "Mathematics", "Informatics"];

function subjectFromResource(resource: ResourceItem) {
  const subject = resource.subject === "IOAA" ? "Astronomy" : resource.subject;
  return subjects.includes(subject) ? subject : "General";
}

export function ResourcesBrowser({ resources }: { resources: ResourceItem[] }) {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject");
  const [subject, setSubject] = useState(requestedSubject && subjects.includes(requestedSubject) ? requestedSubject : "All");
  const [kind, setKind] = useState("All");
  const [query, setQuery] = useState("");

  const kinds = useMemo(() => ["All", ...Array.from(new Set(resources.map((resource) => resource.kind))).sort()], [resources]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const resourceSubject = subjectFromResource(resource);
      const matchesSubject = subject === "All" || resourceSubject === subject;
      const matchesKind = kind === "All" || resource.kind === kind;
      const matchesQuery = !normalizedQuery || [resource.title, resource.kind, resource.folder, resource.subject].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesSubject && matchesKind && matchesQuery;
    });
  }, [kind, query, resources, subject]);

  const grouped = useMemo(() => {
    return subjects
      .filter((item) => item !== "All")
      .map((item) => ({
        subject: item,
        items: filtered.filter((resource) => subjectFromResource(resource) === item),
      }))
      .filter((group) => group.items.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-md p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {subjects.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSubject(item)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-black transition",
                  subject === item ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal hover:border-emerald/30",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
            <label className="flex min-w-0 items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
              <Icon name="search" className="h-4 w-4" />
              <input
                className="min-w-0 bg-transparent outline-none"
                placeholder="Search resources..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal" value={kind} onChange={(event) => setKind(event.target.value)}>
              {kinds.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {grouped.map((group) => (
            <a key={group.subject} href={`#resources-${group.subject.toLowerCase()}`} className="shrink-0 rounded-full bg-mint px-3 py-1.5 text-xs font-black text-emerald">
              {group.subject} ({group.items.length})
            </a>
          ))}
        </div>
      </div>

      <div className="max-h-[760px] space-y-7 overflow-y-auto pr-2">
        {grouped.map((group) => (
          <section key={group.subject} id={`resources-${group.subject.toLowerCase()}`} className="scroll-mt-28">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold text-charcoal">{group.subject}</h2>
              <Badge>{group.items.length} resources</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((resource) => (
                <Link
                  key={resource.id}
                  href={resource.localUrl ?? resource.sourceUrl}
                  target={resource.localUrl ? undefined : "_blank"}
                  className="card-surface group rounded-md p-4 transition hover:-translate-y-1 hover:border-emerald/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-mint text-emerald">
                      <Icon name={resource.kind === "Past Paper" ? "file-text" : resource.kind === "Book" ? "book-open" : "download"} className="h-5 w-5" />
                    </span>
                    <Badge>{resource.kind}</Badge>
                  </div>
                  <h3 className="mt-4 line-clamp-2 min-h-12 font-black text-charcoal">{resource.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-charcoal/60">
                    <span>{resource.pages || "External"} pages</span>
                    {resource.sizeBytes > 0 && <span>{formatBytes(resource.sizeBytes)}</span>}
                    {resource.year && <span>{resource.year}</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-black text-emerald">
                    {resource.localUrl ? "Open resource" : "Open source folder"}
                    <Icon name="chevron" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      {grouped.length === 0 && (
        <div className="rounded-md border border-dashed border-navy/20 bg-white p-10 text-center text-sm font-semibold text-charcoal/70">
          No resources match the current filters.
        </div>
      )}
    </div>
  );
}
