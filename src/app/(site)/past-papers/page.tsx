import { PastPapersBrowser } from "@/components/interactive/past-papers-browser";
import { ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { getDatabasePublishedPastPapers, getDatabasePublishedQuestions } from "@/lib/public-datasets";

export const metadata = {
  title: "Past Papers",
};

export default async function PastPapersPage() {
  const [pastPapers, questions] = await Promise.all([getDatabasePublishedPastPapers(), getDatabasePublishedQuestions()]);
  const totalQuestions = questions.filter((question) => question.paperId).length;
  const latest = [...pastPapers].sort((a, b) => b.year - a.year)[0];
  const years = pastPapers.map((paper) => paper.year);
  const yearLabel = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : "0";
  const subjectCount = new Set(pastPapers.map((paper) => paper.subject)).size;

  return (
    <>
      <PageHero
        title="Past Papers"
        subtitle="Practice NSTC papers with the original pages on screen, a 70-MCQ answer sheet, timer, scratchpad, and one descriptive response area."
        variant="question-bank"
        stats={[
          { label: "Indexed Papers", value: pastPapers.length.toString(), icon: "file-text" },
          { label: "Extracted Questions", value: totalQuestions.toLocaleString(), icon: "clipboard-check" },
          { label: "Years", value: yearLabel, icon: "calendar" },
          { label: "Subjects", value: subjectCount.toString(), icon: "atom" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle
            title="NSTC paper archive"
            copy="Each card opens a paper-first workspace with rendered PDF pages, page navigation, local auto-save, and structured answer recording."
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
