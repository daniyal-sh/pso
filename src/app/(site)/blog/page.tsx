import { BlogCard } from "@/components/sections/cards";
import { Container, PageHero, SectionTitle } from "@/components/sections/common";
import { getPublishedBlogPosts } from "@/lib/public-content";

export const metadata = {
  title: "Blog",
};

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts();
  const authors = new Set(blogPosts.map((post) => post.author));
  const videos = blogPosts.filter((post) => post.videoId).length;

  return (
    <>
      <PageHero
        title="Blog"
        subtitle="Video-backed essays from Pakistani Olympiad alumni sharing the routes, habits, and mindset that took them to MIT."
        variant="blog"
        stats={[
          { label: "Posts", value: blogPosts.length.toString(), icon: "file-text" },
          { label: "Authors", value: authors.size.toString(), icon: "users" },
          { label: "Videos", value: videos.toString(), icon: "eye" },
          { label: "Focus", value: "MIT + NSTC", icon: "book-open" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle title="Latest posts" copy="Video-backed essays from Pakistani Olympiad alumni sharing the routes, habits, and mindset that took them to MIT." />
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
