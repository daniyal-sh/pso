import Link from "next/link";
import { Icon } from "@/components/icon";
import { Badge, ButtonLink, Container, PageHero, SectionTitle } from "@/components/sections/common";
import { pastPapers, questions } from "@/lib/content-data";

export const metadata = {
  title: "Past Papers",
};

const subjects = ["All", "Physics", "Chemistry", "Mathematics", "Biology"];

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
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${
                  subject === "All" ? "border-emerald bg-emerald text-white" : "border-navy/10 bg-white text-charcoal"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          <SectionTitle
            title="NSTC paper archive"
            copy="Each card opens a full practice workspace. Scanned papers include OCR text plus the original page image for diagrams and verification."
            action={
              latest ? (
                <ButtonLink href={`/past-papers/${latest.id}`} icon="rocket">
                  Start latest paper
                </ButtonLink>
              ) : null
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pastPapers.map((paper) => (
              <Link key={paper.id} href={`/past-papers/${paper.id}`} className="card-surface group rounded-md p-5 transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-mint text-emerald">
                    <Icon name={paper.subject === "Mathematics" ? "pi" : paper.subject === "Chemistry" ? "flask" : paper.subject === "Biology" ? "dna" : "atom"} className="h-6 w-6" />
                  </span>
                  <Badge>{paper.year}</Badge>
                </div>
                <h2 className="mt-4 text-lg font-black text-charcoal">{paper.title}</h2>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-charcoal/60">
                  <span>{paper.pages} pages</span>
                  <span>{paper.questionCount} questions</span>
                  <span>{paper.scanned ? "OCR" : "Text"}</span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm font-black text-emerald">
                  Practice paper
                  <Icon name="chevron" className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
