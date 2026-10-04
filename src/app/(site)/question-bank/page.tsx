import { QuestionBankClient } from "@/components/interactive/question-bank-client";
import { Container } from "@/components/sections/common";
import type { Question, QuestionBankItem } from "@/lib/content-data";
import { questionPdfMetadata } from "@/lib/question-pdf-paths";
import { getPublishedQuestions } from "@/lib/public-datasets";

export const metadata = {
  title: "Question Bank",
};

// Pair each question with its extracted PDF crop on the server, so the crop index never
// ships to the browser. Questions without a crop fall back to their extracted text.
function toQuestionBankItem(question: Question): QuestionBankItem | null {
  const pdf = questionPdfMetadata[question.id as keyof typeof questionPdfMetadata];
  if (pdf) {
    return {
      id: question.id,
      subject: pdf.subject,
      year: pdf.year,
      section: pdf.section,
      type: pdf.type === "Long" ? "Long" : "MCQ",
      displayNumber: pdf.displayNumber,
      answer: question.answer,
      solution: question.solution,
      cropPath: pdf.cropPath,
      prompt: "",
      options: [],
      figure: "",
    };
  }

  const hasText = question.prompt.trim().length > 0 && (question.type === "Long" || question.options.length >= 2);
  if (!hasText) return null;
  return {
    id: question.id,
    subject: question.subject,
    year: question.year,
    section: question.section,
    type: question.type,
    displayNumber: question.displayNumber,
    answer: question.answer,
    solution: question.solution,
    cropPath: null,
    prompt: question.prompt,
    options: question.options,
    figure: question.figure,
  };
}

export default async function QuestionBankPage() {
  const questions = await getPublishedQuestions();
  const questionBankQuestions = questions.map(toQuestionBankItem).filter((item): item is QuestionBankItem => item !== null);
  const partI = questionBankQuestions.filter((question) => question.section === "Part I").length;
  const partII = questionBankQuestions.filter((question) => question.section === "Part II").length;
  const descriptive = questionBankQuestions.filter((question) => question.section === "Part III").length;
  const includedIds = new Set(questionBankQuestions.map((question) => question.id));
  const sourcePapers = new Set(questions.filter((question) => includedIds.has(question.id)).map((question) => question.paperId)).size;

  return (
    <>
      <section className="border-b border-navy/10 bg-navy py-5 text-white sm:py-6">
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-gold">NSTC Practice</p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-none sm:text-5xl">Question Bank</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75 sm:text-base">
                Randomized drills from individual NSTC past-paper questions.
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
    </>
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
