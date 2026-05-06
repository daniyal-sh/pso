import { PastPapersBrowser } from "@/components/interactive/past-papers-browser";
import { ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { pastPapers, questions } from "@/lib/content-data";

export const metadata = {
  title: "Past Papers",
};

export default function PastPapersPage() {
  const totalQuestions = questions.filter((question) => question.paperId).length;
  const latest = [...pastPapers].sort((a, b) => b.year - a.year)[0];

  return (
    <>
      <PageHero
        title="Past Papers"
        subtitle="Practice extracted NSTC papers with source-page images, OCR for scanned papers, question navigation, scratchpad, hints, and solution panels."
        stats={[
          { label: "Indexed Papers", value: pastPapers.length.toString(), icon: "file-text" },
          { label: "Extracted Questions", value: totalQuestions.toLocaleString(), icon: "clipboard-check" },
          { label: "Years", value: "2022-2025", icon: "calendar" },
          { label: "Subjects", value: "4", icon: "atom" },
        ]}
      />
      <section className="py-10">
        <Container>
          <SectionTitle
            title="NSTC paper archive"
            copy="Each card opens a practice workspace with Part I common MCQs, Part II subject MCQs, and descriptive questions."
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
