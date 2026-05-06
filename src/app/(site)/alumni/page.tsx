import { Icon } from "@/components/icon";
import { AlumniCard, BlogCard } from "@/components/sections/cards";
import { ButtonLink, Container, PageHero, SectionTitle, StatStrip } from "@/components/sections/common";
import { alumniStories, blogPosts } from "@/lib/data";

export const metadata = {
  title: "Alumni and Community",
};

const filters = ["All", "Medalists", "Campers", "Mentors", "Coaches", "Physics", "Math", "Chemistry", "Biology"];
const groups = ["Mathematics Problem Solving", "Physics Concepts & Proofs", "Chemistry Reactions Hub"];

export default function AlumniPage() {
  return (
    <>
      <PageHero
        title="Alumni & Community"
        subtitle="Learn. Inspire. Give back. Connect with medalists, campers, mentors, and contributors shaping Pakistan's future through science."
        variant="alumni"
        actions={
          <>
            <ButtonLink href="#stories">Explore Alumni Stories</ButtonLink>
            <ButtonLink href="#join" variant="outline" icon="users">
              Join the Community
            </ButtonLink>
          </>
        }
      />
      <StatStrip
        stats={[
          { label: "Alumni Network", value: "20,000+", icon: "users" },
          { label: "International Medals", value: "150+", icon: "trophy" },
          { label: "Mentors & Coaches", value: "250+", icon: "graduation-cap" },
          { label: "Countries Represented", value: "85+", icon: "flag" },
          { label: "Active Contributors", value: "500+", icon: "sparkles" },
          { label: "Partner Institutions", value: "100+", icon: "book-open" },
        ]}
        className="mt-0"
      />

      <section id="stories" className="py-10">
        <Container>
          <SectionTitle title="Alumni stories" copy="Voices from our incredible alumni." />
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                  filter === "All" ? "border-emerald bg-white text-emerald" : "border-navy/10 bg-white text-charcoal"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-5">
            {alumniStories.map((story) => (
              <AlumniCard key={story.name} story={story} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-10">
        <Container className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="dark-panel rounded-md p-6 text-white">
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="flex min-h-64 items-end justify-center rounded-md bg-white/10">
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-mint to-gold text-5xl font-black text-navy">MA</div>
              </div>
              <div>
                <p className="text-sm font-black uppercase text-gold">Featured success story</p>
                <h2 className="mt-2 font-display text-4xl font-bold">From a Small Town to the World Stage</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                  M. Abdullah&apos;s journey from a village in Punjab to becoming a two-time international medalist and mentor for future olympians.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["IChO Gold 2023", "IChO Gold 2024", "Chemistry Mentor"].map((item) => (
                    <div key={item} className="rounded-md border border-white/10 bg-white/10 p-3 text-sm font-bold text-white">
                      {item}
                    </div>
                  ))}
                </div>
                <ButtonLink href="#" className="mt-6">
                  Read Full Story
                </ButtonLink>
              </div>
            </div>
          </div>
          <div className="card-surface rounded-md p-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">Why our community matters</h2>
            <div className="mt-5 space-y-3">
              {["Learn from those who have been there", "Get guidance from mentors and experts", "Find peers who share your passion", "Give back and help others grow", "Build connections that last a lifetime"].map((item) => (
                <p key={item} className="flex items-center gap-3 text-sm font-bold text-charcoal/75">
                  <Icon name="check" className="h-5 w-5 text-emerald" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-10">
        <Container className="grid gap-5 lg:grid-cols-4">
          <div className="card-surface rounded-md p-5">
            <SectionTitle title="From our blog" />
            <div className="space-y-4">
              {blogPosts.slice(0, 3).map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
          <div className="card-surface rounded-md p-5">
            <SectionTitle title="Discussion groups" />
            <div className="space-y-3">
              {groups.map((group, index) => (
                <div key={group} className="flex items-center gap-3 rounded-md border border-navy/10 bg-white p-3">
                  <Icon name={index === 0 ? "pi" : index === 1 ? "atom" : "flask"} className="h-6 w-6 text-emerald" />
                  <div>
                    <p className="text-sm font-black text-charcoal">{group}</p>
                    <p className="text-xs text-charcoal/60">{900 + index * 120} members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-surface rounded-md p-5">
            <SectionTitle title="Events" />
            <div className="space-y-3">
              {["Webinar: Roadmap to IMO 2025", "Workshop: Advanced Problem Solving", "Q&A with Olympiad Mentors"].map((event, index) => (
                <div key={event} className="grid grid-cols-[54px_1fr] gap-3 rounded-md border border-navy/10 bg-white p-3">
                  <div className="rounded-md border border-emerald/20 bg-mint p-2 text-center text-xs font-black text-emerald">
                    May<br />{18 + index * 7}
                  </div>
                  <p className="text-sm font-black text-charcoal">{event}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card-surface rounded-md p-5">
            <SectionTitle title="Contributor spotlight" />
            {["Dr. Ali Usman", "Maria Saeed"].map((name) => (
              <div key={name} className="mb-4 flex items-center gap-3 rounded-md border border-navy/10 bg-white p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-sm font-black text-emerald">
                  {name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-black text-charcoal">{name}</p>
                  <p className="text-xs text-charcoal/60">Mentor and resource creator</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="join" className="pb-10">
        <Container>
          <div className="dark-panel flex flex-col gap-4 rounded-md p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Be part of something bigger</h2>
              <p className="mt-1 text-sm text-white/75">Join thousands of students, alumni, and mentors building a brighter future through science.</p>
            </div>
            <ButtonLink href="/admin/dashboard" icon="users">
              Join the Community
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
