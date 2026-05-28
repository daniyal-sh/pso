import { notFound } from "next/navigation";
import { PastPaperWorkspace } from "@/components/interactive/past-paper-workspace";
import { Container } from "@/components/sections/common";
import { getDatabasePublishedPaperById, getDatabasePublishedPastPapers, getDatabasePublishedQuestionsForPaper } from "@/lib/public-datasets";

export async function generateStaticParams() {
  const pastPapers = await getDatabasePublishedPastPapers();
  return pastPapers.map((paper) => ({ paperId: paper.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getDatabasePublishedPaperById(paperId);
  return {
    title: paper?.title ?? "Past Paper Practice",
  };
}

export default async function PastPaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const paper = await getDatabasePublishedPaperById(paperId);
  if (!paper) notFound();
  const [paperQuestions, pastPapers] = await Promise.all([getDatabasePublishedQuestionsForPaper(paper.id), getDatabasePublishedPastPapers()]);

  return (
    <section className="py-4 md:py-6">
      <Container>
        <PastPaperWorkspace paper={paper} questions={paperQuestions} papers={pastPapers} />
      </Container>
    </section>
  );
}
