import { PastPapersBrowser } from "@/components/interactive/past-papers-browser";
import { ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { getDatabasePublishedPastPapers } from "@/lib/public-datasets";

export const metadata = {
  title: "Past Papers",
};

export default async function PastPapersPage() {
  const pastPapers = await getDatabasePublishedPastPapers();
  const latest = [...pastPapers].sort((a, b) => b.year - a.year)[0];
  const years = pastPapers.map((paper) => paper.year);
  const yearLabel = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : "0";
  const subjectCount = new Set(pastPapers.map((paper) => paper.subject)).size;

  return (
    <>
      <PageHero
        title="Past Papers"
        subtitle="Practice actual NSTC past papers with an MCQ answer sheet, timer, and descriptive responses."
        variant="question-bank"
        stats={[
          { label: "Indexed Papers", value: pastPapers.length.toString(), icon: "file-text" },
          { label: "Years", value: yearLabel, icon: "calendar" },
          { label: "Subjects", value: subjectCount.toString(), icon: "atom" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle
            title="NSTC paper archive"
            action={
              latest ? (
                <ButtonLink href={`/past-papers/${latest.id}`} icon="rocket">
                  Start latest paper
                </ButtonLink>
              ) : null
            }
          />
          <PastPapersBrowser papers={pastPapers} />
        </Container>
      </section>
    </>
  );
}
