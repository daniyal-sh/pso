import { AlumniCard, BlogCard } from "@/components/sections/cards";
import { ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { getPublishedAlumniStories, getPublishedBlogPosts } from "@/lib/public-content";

export const metadata = {
  title: "Alumni and Community",
};

export default async function AlumniPage() {
  const [alumniStories, blogPosts] = await Promise.all([getPublishedAlumniStories(), getPublishedBlogPosts()]);

  return (
    <>
      <PageHero
        title="Alumni & Community"
        subtitle="Real voices from Pakistani Olympiad alumni sharing how they learned, competed, and built their way."
        variant="alumni"
        actions={
          <>
            <ButtonLink href="#stories">Explore Stories</ButtonLink>
            <ButtonLink href="/blog" variant="outline" icon="book-open">
              Read the Blog
            </ButtonLink>
          </>
        }
      />

      <section id="stories" className="py-10">
        <Container>
          <SectionTitle title="Alumni stories" copy="Voices from our incredible alumni." />
          <div className="grid gap-5 md:grid-cols-2">
            {alumniStories.map((story) => (
              <AlumniCard key={story.name} story={story} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-10">
        <Container>
          <SectionTitle title="From our blog" />
          <div className="grid gap-5 lg:grid-cols-2">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
