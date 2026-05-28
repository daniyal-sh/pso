import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { QuestionEditor } from "@/components/admin/dataset-editors";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminQuestionItem, getAdminQuestions } from "@/lib/admin/content";

export const metadata = {
  title: "Question Bank | Admin",
};

export default async function AdminQuestionBankPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const { edit } = await searchParams;
  const [questions, item] = await Promise.all([getAdminQuestions(), getAdminQuestionItem(edit)]);
  const needsSolutions = questions.filter((question) => !question.solution).length;
  const withFigures = questions.filter((question) => question.figure).length;

  return (
    <AdminShell context={context} title="Question Bank" description="Review and edit prompts, answer keys, solutions, figures, and publish status.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Questions" value={questions.length} />
          <Stat label="Need Solutions" value={needsSolutions} />
          <Stat label="With Figures" value={withFigures} />
        </div>
        <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
              <tr>{["Source", "Status", "Subject", "Number", "Type", "Topic", "Solution", "Edit"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
            </thead>
            <tbody>
              {questions.slice(0, 250).map((question) => (
                <tr key={question.id} className="border-b border-white/10">
                  <td className="max-w-[260px] truncate px-4 py-3 text-white/75">{question.source}</td>
                  <td className="px-4 py-3 text-white/75">{question.status}</td>
                  <td className="px-4 py-3 text-white/75">{question.subject}</td>
                  <td className="px-4 py-3 font-mono text-white">{question.displayNumber}</td>
                  <td className="px-4 py-3 text-white/75">{question.type}</td>
                  <td className="px-4 py-3 text-white/75">{question.topic}</td>
                  <td className="px-4 py-3 text-white/75">{question.solution ? "Attached" : "Needed"}</td>
                  <td className="px-4 py-3"><Link href={`/admin/question-bank?edit=${encodeURIComponent(question.id)}`} className="font-black text-emerald">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <QuestionEditor item={item} />
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-5">
      <p className="text-3xl font-black text-white">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm font-bold text-white/60">{label}</p>
    </div>
  );
}
