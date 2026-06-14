import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Pathway } from "@/components/sections/cards";
import { Badge, ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { pathwaySteps, tracks } from "@/lib/data";
import { getPublishedGuides } from "@/lib/public-content";
import { getDatabasePublishedPastPapers, getDatabasePublishedQuestions } from "@/lib/public-datasets";

export function generateStaticParams() {
  return tracks.map((track) => ({ slug: track.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = tracks.find((item) => item.slug === slug);
  return {
    title: track ? `${track.name} Olympiad Track` : "Olympiad Track",
  };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = tracks.find((item) => item.slug === slug);
  if (!track) notFound();
  const [questions, pastPapers, guides] = await Promise.all([
    getDatabasePublishedQuestions(),
    getDatabasePublishedPastPapers(),
    getPublishedGuides(),
  ]);
  const subjectQuestions = questions.filter((question) => question.subject === track.name);
  const subjectPapers = pastPapers.filter((paper) => paper.subject === track.name);
  const subjectGuides = guides
    .filter((guide) => guide.category === track.name || (guide.tags ?? []).includes(track.name))
    .slice(0, 4);

  return (
    <>
      <PageHero
        title={`${track.name} olympiad`}
        subtitle={track.summary}
        kicker={`${track.exam} preparation`}
        variant="olympiads"
        stats={[
          { label: "Guides", value: String(subjectGuides.length), icon: "graduation-cap" },
          { label: "Questions", value: String(subjectQuestions.length), icon: "clipboard-check" },
          { label: "Papers", value: String(subjectPapers.length), icon: "file-text" },
        ]}
      />

      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionTitle title="Preparation outcomes" copy="Core skills and habits for this olympiad track." />
            <div className="grid gap-4 sm:grid-cols-3">
              {track.outcomes.map((outcome) => (
                <div key={outcome} className="card-surface rounded-md p-5">
                  <Icon name="check" className="h-6 w-6 text-emerald" />
                  <p className="mt-3 text-sm font-bold leading-6 text-charcoal">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="card-surface rounded-md p-6">
            <Badge>{track.exam}</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-charcoal">Core topics</h2>
            <div className="mt-5 grid gap-3">
              {track.topics.map((topic) => (
                <div key={topic} className="flex items-center justify-between rounded-md border border-navy/10 bg-white px-4 py-3">
                  <span className="text-sm font-bold text-charcoal">{topic}</span>
                  <Icon name={track.icon} className="h-5 w-5 text-emerald" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/question-bank" variant="light">
                Practice now
              </ButtonLink>
              <ButtonLink href="/guides" variant="light" icon="book-open">
                Read guides
              </ButtonLink>
            </div>
          </aside>
        </Container>
      </section>

      <section className="pb-10">
        <Container className="mb-4">
          <SectionTitle title="Selection pathway" />
        </Container>
        <Pathway steps={track.pathway ?? pathwaySteps} />
        {track.pathwayVerifiedAt ? (
          <Container className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-charcoal/60">
            <p>Pakistan selection pathway last verified {track.pathwayVerifiedAt}. Selection arrangements may change.</p>
            {track.officialUrl ? (
              <a href={track.officialUrl} target="_blank" rel="noreferrer" className="font-black text-emerald hover:underline">
                Official {track.exam} website
              </a>
            ) : null}
          </Container>
        ) : null}
      </section>

      <section className="pb-10">
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface rounded-md p-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">Guides</h2>
            <div className="mt-4 space-y-3">
              {subjectGuides.length ? subjectGuides.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">
                  {guide.title}
                </Link>
              )) : (
                <Link href="/guides" className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">Browse all guides</Link>
              )}
            </div>
          </div>
          <div className="card-surface rounded-md p-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">Past papers</h2>
            <div className="mt-4 space-y-3">
              {subjectPapers.length ? subjectPapers.map((paper) => (
                <Link key={paper.id} href={`/past-papers/${paper.id}`} className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">
                  {paper.title} - {paper.questionCount} questions
                </Link>
              )) : (
                <Link href="/past-papers" className="block rounded-md border border-navy/10 bg-white p-3 text-sm font-bold text-charcoal hover:text-emerald">Browse all past papers</Link>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
