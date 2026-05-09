import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { Badge, ButtonLink, Container, PageHero } from "@/components/sections/common";
import { MarkdownRenderer } from "@/components/sections/markdown-renderer";
import { getPublishedGuideBySlug, getPublishedGuides, getPublishedGuideSlugs } from "@/lib/public-content";

export async function generateStaticParams() {
  const slugs = await getPublishedGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getPublishedGuideBySlug(slug);
  return {
    title: guide?.title ?? "Guide",
    description: guide?.description,
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getPublishedGuideBySlug(slug);
  if (!guide) notFound();
  const related = (await getPublishedGuides()).filter((item) => item.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <PageHero
        title={guide.title}
        subtitle={guide.description}
        kicker={`${guide.category} guide`}
        variant="guides"
        stats={[
          { label: "Reading time", value: guide.readTime, icon: "timer" },
          { label: "Difficulty", value: guide.level, icon: "medal" },
          { label: "Updated", value: guide.updated, icon: "calendar" },
          { label: "Source", value: "Stored", icon: "bookmark" },
        ]}
      />
      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="card-surface min-w-0 rounded-md p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              {guide.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <MarkdownRenderer content={guide.content} />
          </article>
          <aside className="space-y-5">
            <div className="card-surface rounded-md p-5">
              <h2 className="font-black text-charcoal">Guide metadata</h2>
              <div className="mt-4 space-y-3 text-sm text-charcoal/75">
                <p className="flex items-center gap-2">
                  <Icon name="book-open" className="h-4 w-4 text-emerald" />
                  {guide.author}
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="calendar" className="h-4 w-4 text-emerald" />
                  Updated {guide.updated}
                </p>
                <p className="break-all rounded-md bg-mint p-3 text-xs font-semibold text-emerald">{guide.sourceUrl}</p>
              </div>
            </div>
            <div className="card-surface rounded-md p-5">
              <h2 className="font-black text-charcoal">Related guides</h2>
              <div className="mt-4 space-y-3">
                {related.map((item) => (
                  <a key={item.slug} href={`/guides/${item.slug}`} className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
            <ButtonLink href="/guides" variant="light" icon="chevron">
              Back to guides
            </ButtonLink>
          </aside>
        </Container>
      </section>
    </>
  );
}
