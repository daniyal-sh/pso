import { notFound } from "next/navigation";
import { BlogCard } from "@/components/sections/cards";
import { MarkdownRenderer } from "@/components/sections/markdown-renderer";
import { Badge, ButtonLink, Container, PageHero } from "@/components/sections/common";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts, getPublishedBlogSlugs } from "@/lib/public-content";

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  return {
    title: post?.title ?? "Blog Post",
    description: post?.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();
  const blogPosts = await getPublishedBlogPosts();
  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <>
      <PageHero title={post.title} subtitle={post.excerpt} kicker={post.category} variant="blog" />
      <section className="py-10">
        <Container className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <article className="card-surface rounded-md p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge>{post.category}</Badge>
              <Badge>{post.date}</Badge>
              <Badge>{post.author}</Badge>
            </div>
            {post.videoId && (
              <>
                <div className="mt-8 overflow-hidden rounded-md border border-navy/10 bg-charcoal shadow-sm">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${post.videoId}`}
                      title={post.videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
                <a
                  className="mt-4 inline-flex font-bold text-emerald underline-offset-4 hover:underline"
                  href={post.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch on YouTube
                </a>
              </>
            )}
            <div className="mt-8">
              <MarkdownRenderer content={post.content} />
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
