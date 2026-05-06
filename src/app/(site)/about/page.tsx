import { Icon } from "@/components/icon";
import { ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";

export const metadata = {
  title: "About",
};

const principles = [
  ["National pride without cliche", "Rooted in Pakistan's identity through modern, subtle expression.", "flag"],
  ["Academic excellence", "Resources and experiences that uphold high standards.", "graduation-cap"],
  ["Trust and clarity", "Transparent information, credible content, and clear guidance.", "shield"],
  ["Community mentorship", "A supportive network of students, mentors, alumni, and experts.", "users"],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Pakistan Olympiads"
        subtitle="An open-source, community-driven foundation for students preparing for NSTC and international science olympiads."
      />
      <section className="py-10">
        <Container>
          <SectionTitle title="Design philosophy" copy="The platform carries the palette and principles from the reference board: emerald, navy, teal, gold, science motifs, and readable academic polish." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {principles.map(([title, copy, icon]) => (
              <div key={title} className="card-surface rounded-md p-6">
                <Icon name={icon} className="h-8 w-8 text-emerald" />
                <h2 className="mt-4 text-lg font-black text-charcoal">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-charcoal/70">{copy}</p>
              </div>
            ))}
          </div>
          <div className="dark-panel mt-8 rounded-md p-6 text-white">
            <h2 className="font-display text-3xl font-bold">Built for contributors</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">
              The site is organized around imported guides, indexed resources, extracted past-paper questions, and a contributor dashboard for reviewing solutions and metadata.
            </p>
            <div className="mt-5">
              <ButtonLink href="/admin/dashboard">Open dashboard</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
