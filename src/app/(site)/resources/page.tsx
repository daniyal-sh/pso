import { Suspense } from "react";
import { ResourcesBrowser } from "@/components/interactive/resources-browser";
import { Container, PageHero } from "@/components/sections/common";
import { getPublishedResources } from "@/lib/public-datasets";

export const metadata = {
  title: "Resources",
};

export default async function ResourcesPage() {
  const resources = await getPublishedResources();

  return (
    <>
      <PageHero
        title="Resource Library"
        subtitle=""
        variant="guides"
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
