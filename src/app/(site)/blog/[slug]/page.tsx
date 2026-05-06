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
              <p>{post.excerpt}</p>
              <p>
                The strongest preparation plans are specific: choose a resource, define a weekly practice target, review mistakes carefully, and keep a small correction log for ideas that should not be missed twice.
              </p>
              <h2 className="font-display text-3xl font-bold text-charcoal">How to apply this</h2>
              <p>
                Turn the advice into a concrete session. Pick one topic from {post.category}, solve a short set under time pressure, then write down the concept, trick, or misconception behind each missed question.
              </p>
              <p>
                If the session exposes a gap, go back to the relevant guide or resource page before attempting another timed set. That loop keeps practice purposeful instead of merely repetitive.
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
