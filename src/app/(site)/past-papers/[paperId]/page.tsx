import { notFound } from "next/navigation";
import { PastPaperWorkspace } from "@/components/interactive/past-paper-workspace";
import { Container } from "@/components/sections/common";
import { getPublishedPaperById, getPublishedPastPapers, getPublishedQuestionsForPaper } from "@/lib/public-datasets";

export async function generateStaticParams() {
  const pastPapers = await getPublishedPastPapers();
  return pastPapers.map((paper) => ({ paperId: paper.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getPublishedPaperById(paperId);
  return {
    title: paper?.title ?? "Past Paper Practice",
  };
}

export default async function PastPaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getPublishedPaperById(paperId);
  if (!paper) notFound();
  const [paperQuestions, pastPapers] = await Promise.all([getPublishedQuestionsForPaper(paper.id), getPublishedPastPapers()]);

  return (
    <section className="py-4 md:py-6">
      <Container>
        <PastPaperWorkspace paper={paper} questions={paperQuestions} papers={pastPapers} />
      </Container>
    </section>
  );
}
