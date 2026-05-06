import Link from "next/link";
import { Icon } from "@/components/icon";
import { Badge, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { formatBytes, getResourceStats, resources } from "@/lib/content-data";

export const metadata = {
  title: "Resources",
};

const subjects = ["All", "Astronomy", "Physics", "Chemistry", "Biology", "Mathematics", "General"];

export default function ResourcesPage() {
  const stats = getResourceStats();
  const featured = resources.filter((resource) => resource.localUrl).slice(0, 8);
  const external = resources.filter((resource) => !resource.localUrl).slice(0, 8);

  return (
    <>
      <PageHero
        title="Resource Library"
        subtitle="Books, handouts, problem sets, past papers, solutions, and astronomy references from the provided Pakistan Olympiads resource folders."
        variant="guides"
        stats={[
          { label: "Indexed Resources", value: String(stats.total), icon: "book-open" },
          { label: "Local Downloads", value: String(stats.local), icon: "download" },
          { label: "External References", value: String(stats.external), icon: "bookmark" },
          { label: "Subjects", value: String(stats.subjects), icon: "atom" },
        ]}
      />
      <section className="py-10">
        <Container>
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                  subject === "All" ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          <SectionTitle
            title="Downloadable resources"
            copy="Files under the repository-safe size limit were copied into the public resource library. Large textbooks are indexed as external Drive references."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((resource) => (
              <ResourceTile key={resource.id} resource={resource} />
            ))}
          </div>
        </Container>
      </section>
      <section className="pb-10">
        <Container>
          <SectionTitle title="External and large references" copy="Large books and restricted Drive files stay linked to their source folders to keep the GitHub repo deployable." />
          <div className="grid gap-4 lg:grid-cols-2">
            {external.map((resource) => (
              <ResourceTile key={resource.id} resource={resource} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

function ResourceTile({ resource }: { resource: (typeof resources)[number] }) {
  const href = resource.localUrl ?? resource.sourceUrl;
  return (
    <Link href={href} className="card-surface group rounded-md p-5 transition hover:-translate-y-1" target={href.startsWith("http") ? "_blank" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-mint text-emerald">
          <Icon name={resource.kind === "Book" ? "book-open" : resource.kind === "Past Paper" ? "file-text" : "clipboard"} className="h-6 w-6" />
        </span>
        <Badge>{resource.subject}</Badge>
      </div>
      <h2 className="mt-4 line-clamp-2 text-base font-black text-charcoal">{resource.title}</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-charcoal/60">
        <span>{resource.kind}</span>
        <span>{resource.pages} pages</span>
        <span>{formatBytes(resource.sizeBytes)}</span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm font-black text-emerald">
        {resource.localUrl ? "Open file" : "Open source folder"}
        <Icon name={resource.localUrl ? "download" : "chevron"} className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
