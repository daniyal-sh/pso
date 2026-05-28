import { TrackCard } from "@/components/sections/cards";
import { Container, PageHero, SectionTitle } from "@/components/sections/common";
import { tracks } from "@/lib/data";
import { getPublishedGuides } from "@/lib/public-content";
import { getDatabasePublishedPastPapers, getDatabasePublishedQuestions } from "@/lib/public-datasets";

export const metadata = {
  title: "Olympiad Tracks",
};

export default async function OlympiadsPage() {
  const [guides, pastPapers, questions] = await Promise.all([
    getPublishedGuides(),
    getDatabasePublishedPastPapers(),
    getDatabasePublishedQuestions(),
  ]);
  const trackStats = tracks.map((track) => {
    const trackGuides = guides.filter((guide) => guide.category === track.name || (guide.tags ?? []).includes(track.name)).length;
    const trackPapers = pastPapers.filter((paper) => paper.subject === track.name).length;
    const trackQuestions = questions.filter((question) => question.subject === track.name).length;
    return {
      track,
      guides: trackGuides,
      papers: trackPapers,
      questions: trackQuestions,
    };
  });
  const activeTracks = trackStats.filter((item) => item.guides > 0 || item.papers > 0 || item.questions > 0).length;

  return (
    <>
      <PageHero
        title="Olympiad tracks"
        subtitle="Pick a discipline and jump into the guides, past papers, and extracted questions currently available in the database."
        variant="olympiads"
        stats={[
          { label: "Active Tracks", value: String(activeTracks), icon: "sparkles" },
          { label: "Past Papers", value: String(pastPapers.length), icon: "file-text" },
          { label: "Questions", value: String(questions.length), icon: "clipboard-check" },
          { label: "Guides", value: String(guides.length), icon: "book-open" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle title="Explore every discipline" copy="Counts reflect the current database-backed guides, papers, and question bank." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trackStats.map(({ track, guides: guideCount, papers, questions: questionCount }) => (
              <TrackCard
                key={track.slug}
                track={track}
                stats={[
                  { label: "Guides", value: guideCount },
                  { label: "Papers", value: papers },
                  { label: "Questions", value: questionCount },
                ]}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
