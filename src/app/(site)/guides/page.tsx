import { GuidesBrowser } from "@/components/interactive/guides-browser";
import { Badge, ButtonLink, Container, PageHero } from "@/components/sections/common";
import { getPublishedGuides } from "@/lib/public-content";
import { getPublishedQuestions, getQuestionStatsForRows } from "@/lib/public-datasets";

export const metadata = {
  title: "Guides",
};

export default async function GuidesPage() {
  const [guides, questions] = await Promise.all([getPublishedGuides(), getPublishedQuestions()]);
  const featured = guides.find((guide) => guide.featured) ?? guides[0];
  const questionStats = getQuestionStatsForRows(questions);

  return (
    <>
      <PageHero
        title="Guides"
        subtitle="Imported preparation guides, roadmaps, and olympiad advice from mentors and alumni."
        variant="guides"
        stats={[
          { label: "Guides & Articles", value: guides.length.toString(), icon: "book-open" },
          { label: "Subjects Covered", value: new Set(guides.map((guide) => guide.category)).size.toString(), icon: "atom" },
          { label: "Past Questions", value: questionStats.total.toString(), icon: "clipboard-check" },
          { label: "Source Guides", value: "6", icon: "bookmark" },
        ]}
      />

      <section className="py-8">
        <Container>
          {featured && (
            <div className="mt-6 grid min-w-0 overflow-hidden rounded-md bg-navy text-white shadow-2xl lg:grid-cols-[0.9fr_1.2fr]">
              <div className="science-field dark-panel min-h-[280px] p-8">
                <div className="relative z-10 flex h-full flex-col justify-end rounded-md border border-gold/25 p-6">
                  <Badge className="w-fit border-gold/20 bg-gold/20 text-gold">Featured Guide</Badge>
                  <h2 className="mt-6 max-w-sm font-display text-3xl font-bold leading-none text-white sm:text-4xl">{featured.title}</h2>
                </div>
              </div>
              <div className="p-8">
                <Badge className="border-gold/20 bg-gold/20 text-gold">Featured Guide</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{featured.title}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">{featured.description}</p>
                <div className="mt-6 grid gap-4 text-sm text-white/75 sm:grid-cols-3">
                  <span>{featured.readTime}</span>
                  <span>{featured.level}</span>
                  <span>{featured.updated}</span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href={`/guides/${featured.slug}`}>Read Guide</ButtonLink>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section className="pb-10">
        <Container>
          <GuidesBrowser guides={guides} />
        </Container>
      </section>
    </>
  );
}
