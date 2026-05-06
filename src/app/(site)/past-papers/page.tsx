import { PastPaperPractice } from "@/components/interactive/past-paper-practice";
import { Container, PageHero } from "@/components/sections/common";

export const metadata = {
  title: "Past Paper Practice",
};

export default function PastPapersPage() {
  return (
    <>
      <PageHero
        title="Past Paper Practice"
        subtitle="Sharpen your skills with real past-paper style questions, timed practice, navigation, scratch work, hints, and solutions."
        stats={[
          { label: "Questions Attempted", value: "12 / 40", icon: "file-text" },
          { label: "Accuracy", value: "75%", icon: "timer" },
          { label: "Time Spent", value: "18m 32s", icon: "timer" },
          { label: "Mode", value: "Practice", icon: "shield" },
        ]}
      />
      <section className="py-8">
        <Container>
          <PastPaperPractice />
        </Container>
      </section>
    </>
  );
}
