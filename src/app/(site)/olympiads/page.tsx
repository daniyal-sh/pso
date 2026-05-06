import { TrackCard } from "@/components/sections/cards";
import { Container, PageHero, SectionTitle } from "@/components/sections/common";
import { tracks } from "@/lib/data";

export const metadata = {
  title: "Olympiad Tracks",
};

export default function OlympiadsPage() {
  return (
    <>
      <PageHero
        title="Olympiad tracks"
        subtitle="Pick a discipline, understand the selection pathway, and build a plan around concepts, practice, and mentorship."
        kicker="Science disciplines"
        stats={[
          { label: "Subjects", value: "6", icon: "atom" },
          { label: "Topic Maps", value: "250+", icon: "route" },
          { label: "Practice Questions", value: "85K+", icon: "clipboard-check" },
          { label: "Mentors", value: "250+", icon: "users" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle title="Explore every discipline" copy="Each track is structured for NSTC foundations and international olympiad depth." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => (
              <TrackCard key={track.slug} track={track} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
