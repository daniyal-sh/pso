import { Suspense } from "react";
import { ResourcesBrowser } from "@/components/interactive/resources-browser";
import { Container, PageHero } from "@/components/sections/common";
import { getResourceStats, resources } from "@/lib/content-data";

export const metadata = {
  title: "Resources",
};

export default function ResourcesPage() {
  const stats = getResourceStats();

  return (
    <>
      <PageHero
        title="Resource Library"
        subtitle="Books, handouts, problem sets, past papers, solutions, and astronomy references grouped by subject."
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
          <Suspense fallback={<div className="card-surface rounded-md p-6 text-sm font-semibold text-charcoal/70">Loading resources...</div>}>
            <ResourcesBrowser resources={resources} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
