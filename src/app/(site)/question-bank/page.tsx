import { QuestionBankClient } from "@/components/interactive/question-bank-client";
import { Container, PageHero, StatStrip } from "@/components/sections/common";
import { getQuestionStats, questions } from "@/lib/content-data";

export const metadata = {
  title: "Question Bank",
};

export default function QuestionBankPage() {
  const stats = getQuestionStats();
  const partI = questions.filter((question) => question.section === "Part I").length;
  const partII = questions.filter((question) => question.section === "Part II").length;
  const diagrams = questions.filter((question) => question.figure).length;
  return (
    <>
      <PageHero
        title="Question Bank"
        subtitle="Topic-wise practice for NSTC and olympiads. Solve curated MCQs, reveal detailed solutions, and build momentum."
        variant="question-bank"
        stats={[
          { label: "Extracted Questions", value: stats.total.toLocaleString(), icon: "clipboard-check" },
          { label: "MCQs", value: stats.mcqs.toLocaleString(), icon: "list-checks" },
          { label: "Long Problems", value: stats.long.toLocaleString(), icon: "book-open" },
          { label: "Source Papers", value: stats.papers.toLocaleString(), icon: "file-text" },
        ]}
      />
      <section className="py-8">
        <Container>
          <QuestionBankClient questions={questions} />
        </Container>
      </section>
      <StatStrip
        stats={[
          { label: "Common MCQs", value: partI.toLocaleString(), icon: "star" },
          { label: "Subject MCQs", value: partII.toLocaleString(), icon: "timer" },
          { label: "Descriptive", value: stats.long.toLocaleString(), icon: "book-open" },
          { label: "Diagram Crops", value: diagrams.toLocaleString(), icon: "sparkles" },
          { label: "Subjects", value: stats.subjects.toLocaleString(), icon: "atom" },
          { label: "Source Papers", value: stats.papers.toLocaleString(), icon: "file-text" },
        ]}
      />
    </>
  );
}
