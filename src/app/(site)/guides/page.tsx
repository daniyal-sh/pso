import Link from "next/link";
import { Icon } from "@/components/icon";
import { GuidePreviewCard, Pathway } from "@/components/sections/cards";
import { Badge, ButtonLink, Container, PageHero } from "@/components/sections/common";
import { pathwaySteps, recommendedBooks } from "@/lib/data";
import { formatBytes, resources } from "@/lib/content-data";
import { getAllGuides } from "@/lib/guides";

export const metadata = {
  title: "Guides and Resources",
};

const filters = ["All", "Physics", "Astronomy", "Chemistry", "Biology", "Mathematics", "Informatics", "NSTC", "Beginner", "Advanced"];

export default function GuidesPage() {
  const guides = getAllGuides();
  const featured = guides.find((guide) => guide.featured) ?? guides[0];

  return (
    <>
      <PageHero
        title="Guides & Resources"
        subtitle="Curated preparation guides, book recommendations, roadmaps, and olympiad advice from mentors and alumni."
        variant="guides"
        stats={[
          { label: "Guides & Articles", value: guides.length.toString(), icon: "book-open" },
          { label: "Resources Indexed", value: resources.length.toString(), icon: "download" },
          { label: "Past Questions", value: "538", icon: "clipboard-check" },
          { label: "Contributors", value: "Open", icon: "users" },
        ]}
      />

      <section className="py-8">
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                    filter === "All" ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal"
                  }`}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <label className="flex min-w-0 items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
                <Icon name="search" className="h-4 w-4" />
                <input className="min-w-0 bg-transparent outline-none" placeholder="Search guides, topics, authors..." />
              </label>
              <select className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal">
                <option>Latest</option>
                <option>Most read</option>
                <option>Beginner first</option>
              </select>
            </div>
          </div>

          {featured && (
            <div className="mt-6 grid overflow-hidden rounded-md bg-navy text-white shadow-2xl lg:grid-cols-[0.9fr_1.2fr]">
              <div className="science-field dark-panel min-h-[280px] p-8">
                <div className="relative z-10 flex h-full flex-col justify-end rounded-md border border-gold/25 p-6">
                  <Badge className="w-fit border-gold/20 bg-gold/20 text-gold">Featured Guide</Badge>
                  <h2 className="mt-6 max-w-sm font-display text-4xl font-bold leading-none text-white">{featured.title}</h2>
                </div>
              </div>
              <div className="p-8">
                <Badge className="border-gold/20 bg-gold/20 text-gold">Featured Guide</Badge>
                <h2 className="mt-3 font-display text-4xl font-bold text-white">{featured.title}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">{featured.description}</p>
                <div className="mt-6 grid gap-4 text-sm text-white/75 sm:grid-cols-3">
                  <span>{featured.readTime}</span>
                  <span>{featured.level}</span>
                  <span>{featured.updated}</span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href={`/guides/${featured.slug}`}>Read Guide</ButtonLink>
                  <ButtonLink href="#" variant="outline" icon="bookmark">
                    Save for Later
                  </ButtonLink>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section className="pb-10">
        <Container className="grid gap-8 lg:grid-cols-[1fr_0.52fr]">
          <div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {guides.map((guide) => (
                <GuidePreviewCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
          <aside className="space-y-5">
            <div className="card-surface rounded-md p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-charcoal">Downloadable Resources</h2>
                <Link href="#" className="text-sm font-black text-emerald">
                  View all
                </Link>
              </div>
              <div className="mt-4 divide-y divide-navy/10">
                {resources.filter((resource) => resource.localUrl).slice(0, 6).map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-500">
                        <Icon name="file-text" className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="line-clamp-1 text-sm font-black text-charcoal">{resource.title}</p>
                        <p className="text-xs text-charcoal/60">{resource.kind} - {formatBytes(resource.sizeBytes)}</p>
                      </div>
                    </div>
                    <Link href={resource.localUrl ?? resource.sourceUrl} target={resource.localUrl ? undefined : "_blank"} className="shrink-0 text-emerald">
                      <Icon name="download" className="h-5 w-5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface rounded-md p-5">
              <h2 className="font-black text-charcoal">NSTC Pathway</h2>
              <div className="mt-4">
                <Pathway steps={pathwaySteps.slice(0, 4)} />
              </div>
            </div>

            <div className="card-surface rounded-md p-5">
              <h2 className="font-black text-charcoal">Recommended Books</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recommendedBooks.map((book) => (
                  <div key={book.title} className="rounded-md border border-navy/10 bg-white p-3">
                    <div className="soft-grid mb-3 flex h-20 items-center justify-center rounded bg-mint text-emerald">
                      <Icon name="book-open" className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-black text-charcoal">{book.title}</p>
                    <p className="text-xs text-charcoal/60">{book.author}</p>
                    <p className="mt-2 text-xs font-black text-emerald">{book.tag}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </Container>
      </section>

      <section className="pb-10">
        <Container>
          <div className="dark-panel flex flex-col gap-5 rounded-md p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Learn from the best. Achieve your best.</h2>
              <p className="mt-1 text-sm text-white/75">Guides are written by mentors, alumni, and subject contributors.</p>
            </div>
            <ButtonLink href="/alumni">Meet our mentors</ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
