import { BlogCard } from "@/components/sections/cards";
import { Container, PageHero, SectionTitle } from "@/components/sections/common";
import { blogPosts } from "@/lib/data";

export const metadata = {
  title: "Blog",
};

const categories = ["All", "Astronomy", "Physics", "Chemistry", "Biology", "Informatics", "Study Plan"];

export default function BlogPage() {
  return (
    <>
      <PageHero
        title="Blog"
        subtitle="Preparation essays, mentor notes, study plans, and reflections from Pakistan's olympiad community."
        stats={[
          { label: "Posts", value: "892", icon: "file-text" },
          { label: "Authors", value: "80+", icon: "users" },
          { label: "Topics", value: "250+", icon: "book-open" },
          { label: "Monthly Readers", value: "32K", icon: "eye" },
        ]}
      />
      <section className="py-10">
        <Container>
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                  category === "All" ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal"
                }`}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <SectionTitle title="Latest posts" copy="Mock content now, ready for a CMS or Supabase-backed editorial workflow later." />
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
