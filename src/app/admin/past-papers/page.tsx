import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";
import { pastPapers } from "@/lib/content-data";

export const metadata = {
  title: "Past Papers | Admin",
};

export default async function AdminPastPapersPage() {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const scanned = pastPapers.filter((paper) => paper.scanned).length;

  return (
    <AdminShell context={context} title="Past Papers" description="Manage paper metadata, OCR status, answer-key readiness, and page assets.">
      <div className="mb-5 rounded-md border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <Icon name="file-text" className="h-10 w-10 text-gold" />
          <div>
            <p className="text-3xl font-black text-white">{pastPapers.length.toLocaleString()}</p>
            <p className="text-sm font-bold text-white/65">{scanned} OCR-scanned papers need proofreading controls in Supabase.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pastPapers.map((paper) => (
          <article key={paper.id} className="rounded-md border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase text-emerald">{paper.subject} {paper.year}</p>
            <h2 className="mt-2 text-lg font-black text-white">{paper.title}</h2>
            <p className="mt-3 text-sm text-white/60">{paper.pages} pages, {paper.questionCount} extracted questions</p>
            <p className="mt-3 rounded-md bg-[#061117]/70 px-3 py-2 text-xs font-bold text-white/60">{paper.scanned ? "OCR review" : "Digital text"}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
