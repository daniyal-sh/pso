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
        subtitle={`${paper.exam} ${paper.year} ${paper.subject} practice with Part I common MCQs, Part II subject MCQs, and descriptive questions.`}
        stats={[
          { label: "MCQs", value: paper.mcqCount.toString(), icon: "clipboard-check" },
          { label: "Common", value: paper.partICount.toString(), icon: "list-checks" },
          { label: "Subject", value: paper.partIICount.toString(), icon: "atom" },
          { label: "Descriptive", value: paper.descriptiveCount.toString(), icon: "book-open" },
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
