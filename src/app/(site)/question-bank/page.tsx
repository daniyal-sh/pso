import { QuestionBankClient } from "@/components/interactive/question-bank-client";
import { Container, PageHero, StatStrip } from "@/components/sections/common";
import { getQuestionStats, questions } from "@/lib/content-data";

export const metadata = {
  title: "Question Bank",
};

export default function QuestionBankPage() {
  const stats = getQuestionStats();
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
          { label: "Average Quality", value: "4.8/5", icon: "star" },
          { label: "Correctly Solved", value: "92%", icon: "timer" },
          { label: "Total Attempts", value: "1.2M+", icon: "sparkles" },
          { label: "Community Solutions", value: "18K+", icon: "users" },
          { label: "New Questions", value: "Daily", icon: "sun" },
          { label: "Mock Data", value: "Ready", icon: "shield" },
        ]}
      />
    </>
  );
}
