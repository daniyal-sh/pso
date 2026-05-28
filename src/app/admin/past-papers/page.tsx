import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PastPaperEditor } from "@/components/admin/dataset-editors";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPastPaperItem, getAdminPastPapers } from "@/lib/admin/content";

export const metadata = {
  title: "Past Papers | Admin",
};

export default async function AdminPastPapersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const { edit } = await searchParams;
  const [pastPapers, item] = await Promise.all([getAdminPastPapers(), getAdminPastPaperItem(edit)]);
  const scanned = pastPapers.filter((paper) => paper.scanned).length;

  return (
    <AdminShell context={context} title="Past Papers" description="Manage paper metadata, source PDFs, rendered pages, and publication status.">
      <div className="space-y-6">
        <div className="rounded-md border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <Icon name="file-text" className="h-10 w-10 text-gold" />
            <div>
              <p className="text-3xl font-black text-white">{pastPapers.length.toLocaleString()}</p>
              <p className="text-sm font-bold text-white/65">{scanned} camera-scan papers marked for OCR review.</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
              <tr>{["Paper", "Status", "Subject", "Year", "Pages", "Questions", "Assets", "Edit"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
            </thead>
            <tbody>
              {pastPapers.map((paper) => (
                <tr key={paper.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-black text-white">{paper.title}</td>
                  <td className="px-4 py-3 text-white/75">{paper.status}</td>
                  <td className="px-4 py-3 text-white/75">{paper.subject}</td>
                  <td className="px-4 py-3 text-white/75">{paper.year}</td>
                  <td className="px-4 py-3 text-white/75">{paper.pages}</td>
                  <td className="px-4 py-3 text-white/75">{paper.questionCount}</td>
                  <td className="px-4 py-3 text-white/75">{paper.pageImages.length} page images</td>
                  <td className="px-4 py-3"><Link href={`/admin/past-papers?edit=${encodeURIComponent(paper.id)}`} className="font-black text-emerald">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PastPaperEditor item={item} />
      </div>
    </AdminShell>
  );
}
