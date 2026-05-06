import { notFound } from "next/navigation";
import { BlogCard } from "@/components/sections/cards";
import { Badge, ButtonLink, Container, PageHero } from "@/components/sections/common";
import { blogPosts } from "@/lib/data";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  return {
    title: post?.title ?? "Blog Post",
    description: post?.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();
  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <>
      <PageHero title={post.title} subtitle={post.excerpt} kicker={post.category} />
      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <article className="card-surface rounded-md p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge>{post.category}</Badge>
              <Badge>{post.date}</Badge>
              <Badge>{post.author}</Badge>
            </div>
            <div className="mt-8 space-y-5 text-base leading-8 text-charcoal/80">
              <p>
                This placeholder article establishes the editorial page design. It can later render MDX, comments, and author profiles from a real content backend.
              </p>
              <p>
                Pakistan Olympiads content should stay precise, generous, and practical: clear roadmaps, honest difficulty notes, and advice from students who have walked the path.
              </p>
              <h2 className="font-display text-3xl font-bold text-charcoal">Contributor checklist</h2>
              <p>
                Add source links, verify dates, credit authors, and include worked examples wherever possible. Keep the tone ambitious without making preparation feel inaccessible.
              </p>
            </div>
          </article>
          <aside className="space-y-5">
            <div className="card-surface rounded-md p-5">
              <h2 className="font-black text-charcoal">Related posts</h2>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
            <ButtonLink href="/blog" variant="light">
              Back to blog
            </ButtonLink>
          </aside>
        </Container>
      </section>
    </>
  );
}
