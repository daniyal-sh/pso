"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import { formatBytes, type ResourceItem } from "@/lib/content-data";
import { cn } from "@/lib/utils";
import { normalizeSubject, sortSubjects } from "@/lib/subjects";

function subjectFromResource(resource: ResourceItem) {
  return normalizeSubject(resource.subject || "General");
}

function iconForKind(kind: string) {
  if (kind === "Past Paper") return "file-text";
  if (kind === "Book" || kind === "Guide") return "book-open";
  if (kind === "Problem Set") return "clipboard-check";
  if (kind === "Solution") return "check";
  return "download";
}

export function ResourcesBrowser({ resources }: { resources: ResourceItem[] }) {
  const subjects = useMemo(() => ["All", ...sortSubjects(Array.from(new Set(resources.map(subjectFromResource))))], [resources]);
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
      const matchesQuery =
        !normalizedQuery || [resource.title, resource.description, resource.kind, resource.folder, resource.subject].join(" ").toLowerCase().includes(normalizedQuery);
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
  }, [filtered, subjects]);

  const visibleStats = useMemo(
    () => [
      { label: "Shown", value: filtered.length.toString(), icon: "book-open" },
      { label: "Links", value: filtered.filter((resource) => resource.localUrl || resource.sourceUrl).length.toString(), icon: "download" },
      { label: "Subjects", value: new Set(filtered.map((resource) => subjectFromResource(resource))).size.toString(), icon: "atom" },
    ],
    [filtered],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="card-surface h-fit rounded-md p-4 lg:sticky lg:top-24">
        <h2 className="text-sm font-black uppercase tracking-wide text-charcoal">Filter Library</h2>
        <label className="mt-4 flex min-w-0 items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
          <Icon name="search" className="h-4 w-4" />
          <input className="min-w-0 bg-transparent outline-none" placeholder="Search resources..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase text-charcoal/55">Subject</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {subjects.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSubject(item)}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-black transition",
                  subject === item ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal hover:border-emerald/30",
                )}
              >
                <span>{item}</span>
                <span className={cn("text-xs", subject === item ? "text-white/75" : "text-charcoal/45")}>
                  {item === "All" ? resources.length : resources.filter((resource) => subjectFromResource(resource) === item).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-black uppercase text-charcoal/55">Type</span>
          <select className="w-full rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal" value={kind} onChange={(event) => setKind(event.target.value)}>
            {kinds.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </aside>

      <div className="min-w-0 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {visibleStats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-navy/10 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-mint text-emerald">
                  <Icon name={stat.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-black text-charcoal">{stat.value}</p>
                  <p className="text-xs font-bold uppercase text-charcoal/55">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto rounded-md border border-navy/10 bg-white p-3">
          {grouped.map((group) => (
            <a key={group.subject} href={`#resources-${group.subject.toLowerCase()}`} className="shrink-0 rounded-full bg-mint px-3 py-1.5 text-xs font-black text-emerald hover:bg-emerald hover:text-white">
              {group.subject} ({group.items.length})
            </a>
          ))}
        </div>

        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.subject} id={`resources-${group.subject.toLowerCase()}`} className="scroll-mt-28">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl font-bold text-charcoal">{group.subject}</h2>
                  <p className="text-sm text-charcoal/65">Uploaded preparation files for {group.subject.toLowerCase()}.</p>
                </div>
                <Badge>{group.items.length} resources</Badge>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {group.items.map((resource) => {
                  const resourceHref = resource.localUrl || resource.sourceUrl;
                  const isExternal = resourceHref.startsWith("http://") || resourceHref.startsWith("https://");
                  return (
                    <article key={resource.id} className="card-surface flex min-h-56 flex-col rounded-md p-5 transition hover:-translate-y-1 hover:border-emerald/30">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-mint text-emerald">
                          <Icon name={iconForKind(resource.kind)} className="h-6 w-6" />
                        </span>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge>{resource.kind}</Badge>
                          {resource.year && <Badge>{resource.year}</Badge>}
                        </div>
                      </div>
                      <h3 className="mt-4 text-xl font-black leading-snug text-charcoal">{resource.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-charcoal/70">{resource.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-charcoal/55">
                        <span className="rounded-full bg-cool px-3 py-1">{resource.pages || "Unknown"} pages</span>
                        {resource.sizeBytes > 0 && <span className="rounded-full bg-cool px-3 py-1">{formatBytes(resource.sizeBytes)}</span>}
                        <span className="rounded-full bg-cool px-3 py-1">{resource.folder}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {resourceHref ? (
                          <Link
                            href={resourceHref}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noreferrer" : undefined}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald px-4 py-2 text-sm font-black text-white transition hover:bg-teal"
                          >
                            {resource.localUrl ? "Open file" : "Open link"}
                            <Icon name="download" className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-navy/10 bg-cool px-4 py-2 text-sm font-black text-charcoal/55">
                            File pending
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
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
    </div>
  );
}
