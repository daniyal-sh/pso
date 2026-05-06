import { AlumniCard, BlogCard, ResourceCard, TrackCard, Pathway } from "@/components/sections/cards";
import { ButtonLink, Container, PageHero, SectionTitle, StatStrip } from "@/components/sections/common";
import { alumniStories, blogPosts, featuredResources, pathwaySteps, tracks } from "@/lib/data";
import { getQuestionStats, getResourceStats, pastPapers } from "@/lib/content-data";

export default function HomePage() {
  const questionStats = getQuestionStats();
  const resourceStats = getResourceStats();
  const liveStats = [
    { label: "Indexed Resources", value: `${resourceStats.total}+`, icon: "book-open" },
    { label: "Extracted Questions", value: `${questionStats.total}+`, icon: "clipboard-check" },
    { label: "Past Papers", value: `${pastPapers.length}`, icon: "file-text" },
    { label: "Contributors", value: "Open", icon: "users" },
    { label: "Olympiad Tracks", value: "6", icon: "sparkles" },
    { label: "Guide Articles", value: "15+", icon: "trophy" },
  ];
  return (
    <>
      <PageHero
        title="Pakistan's home for science olympiads"
        subtitle="High-quality resources, expert guides, alumni insights, and endless practice to help you excel in NSTC and international olympiads."
        variant="home"
        actions={
          <>
            <ButtonLink href="/question-bank" icon="rocket">
              Start Preparing
            </ButtonLink>
            <ButtonLink href="/guides" variant="outline" icon="book-open">
              Explore Guides
            </ButtonLink>
          </>
        }
      />

      <section className="py-8">
        <Container>
          <SectionTitle eyebrow="Olympiad Tracks" title="Choose your discipline" copy="Explore your passion, follow a roadmap, and practice with focused problem sets." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => (
              <TrackCard key={track.slug} track={track} />
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container className="mb-4">
          <SectionTitle eyebrow="Pathway" title="Your pathway to the international stage" copy="A proven journey from screening to team selection." />
        </Container>
        <Pathway steps={pathwaySteps} />
      </section>

      <section className="py-8">
        <Container>
          <SectionTitle eyebrow="Featured Resources" title="Focused resources for serious preparation" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {featuredResources.map((resource) => (
              <ResourceCard key={resource.title} resource={resource} />
            ))}
          </div>
        </Container>
      </section>

      <StatStrip stats={liveStats} />

      <section className="py-8">
        <Container>
          <SectionTitle
            eyebrow="Latest From Our Blog"
            title="Notes from mentors and alumni"
            action={
              <ButtonLink href="/blog" variant="light">
                View all posts
              </ButtonLink>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {blogPosts.slice(0, 4).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-10">
        <Container>
          <SectionTitle
            eyebrow="From Our Community"
            title="Alumni stories that light the path"
            action={
              <ButtonLink href="/alumni" variant="light">
                View all stories
              </ButtonLink>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {alumniStories.slice(0, 3).map((story) => (
              <AlumniCard key={story.name} story={story} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
