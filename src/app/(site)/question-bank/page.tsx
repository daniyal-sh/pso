import { QuestionBankClient } from "@/components/interactive/question-bank-client";
import { Container, PageHero, StatStrip } from "@/components/sections/common";

export const metadata = {
  title: "Question Bank",
};

export default function QuestionBankPage() {
  return (
    <>
      <PageHero
        title="Question Bank"
        subtitle="Topic-wise practice for NSTC and olympiads. Solve curated MCQs, reveal detailed solutions, and build momentum."
        variant="question-bank"
        stats={[
          { label: "Questions", value: "85,000+", icon: "clipboard-check" },
          { label: "Practice Sets", value: "12,500+", icon: "route" },
          { label: "Topics", value: "250+", icon: "book-open" },
          { label: "Students Practicing", value: "20,000+", icon: "users" },
        ]}
      />
      <section className="py-8">
        <Container>
          <QuestionBankClient />
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
