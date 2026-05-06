import { notFound } from "next/navigation";
import { PastPaperPractice } from "@/components/interactive/past-paper-practice";
import { Container, PageHero } from "@/components/sections/common";
import { getPaperById, getQuestionsForPaper, pastPapers } from "@/lib/content-data";

export function generateStaticParams() {
  return pastPapers.map((paper) => ({ paperId: paper.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = getPaperById(paperId);
  return {
    title: paper?.title ?? "Past Paper Practice",
  };
}

export default async function PastPaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = getPaperById(paperId);
  if (!paper) notFound();
  const paperQuestions = getQuestionsForPaper(paper.id);

  return (
    <>
      <PageHero
        title={paper.title}
        subtitle={`${paper.exam} ${paper.year} ${paper.subject} practice with ${paperQuestions.length} extracted questions, page references, and original PDF images.`}
        stats={[
          { label: "Questions", value: paperQuestions.length.toString(), icon: "clipboard-check" },
          { label: "Pages", value: paper.pages.toString(), icon: "file-text" },
          { label: "Subject", value: paper.subject, icon: "atom" },
          { label: "Extraction", value: paper.scanned ? "OCR" : "Text", icon: "eye" },
        ]}
      />
      <section className="py-8">
        <Container>
          <PastPaperPractice paper={paper} questions={paperQuestions} papers={pastPapers} />
        </Container>
      </section>
    </>
  );
}
