import { QuestionBankClient } from "@/components/interactive/question-bank-client";
import { Container } from "@/components/sections/common";
import { questionPdfMetadata } from "@/lib/question-pdf-paths";
import { getPublishedQuestions } from "@/lib/public-datasets";

export const metadata = {
  title: "Question Bank",
};

export default async function QuestionBankPage() {
  const questions = await getPublishedQuestions();
  const questionBankQuestions = questions.filter((question) => question.id in questionPdfMetadata);
  const pdfRows = Object.values(questionPdfMetadata);
  const partI = pdfRows.filter((question) => question.section === "Part I").length;
  const partII = pdfRows.filter((question) => question.section === "Part II").length;
  const descriptive = pdfRows.filter((question) => question.section === "Part III").length;
  const sourcePapers = new Set(pdfRows.map((question) => question.paperId)).size;

  return (
    <main>
      <section className="border-b border-navy/10 bg-navy py-5 text-white sm:py-6">
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-gold">NSTC Practice</p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-none sm:text-5xl">Question Bank</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75 sm:text-base">
                Randomized drills from individual extracted NSTC question PDFs.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
              <Stat label="Subject MCQs" value={partII.toLocaleString()} />
              <Stat label="Common MCQs" value={partI.toLocaleString()} />
              <Stat label="Descriptive" value={descriptive.toLocaleString()} />
              <Stat label="Papers" value={sourcePapers.toLocaleString()} />
            </dl>
          </div>
        </Container>
      </section>
      <section className="py-4 sm:py-6">
        <Container>
          <QuestionBankClient questions={questionBankQuestions} />
        </Container>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
      <dt className="text-[11px] font-bold text-white/65">{label}</dt>
      <dd className="text-xl font-black leading-tight text-white">{value}</dd>
    </div>
  );
}
