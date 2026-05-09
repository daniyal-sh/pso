import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";
import { resources } from "@/lib/content-data";

export const metadata = {
  title: "Resources | Admin",
};

export default async function AdminResourcesPage() {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const external = resources.filter((resource) => !resource.localUrl).length;

  return (
    <AdminShell context={context} title="Resources" description="Review resource metadata, source links, storage status, and upload readiness.">
      <DatasetHeader total={resources.length} secondary={`${external} external links`} icon="download" />
      <DatasetTable
        headers={["Title", "Subject", "Kind", "Storage", "Source"]}
        rows={resources.slice(0, 80).map((resource) => [
          resource.title,
          resource.subject,
          resource.kind,
          resource.localUrl ? "Local file" : "External source",
          resource.sourceUrl || "Not attached",
        ])}
      />
    </AdminShell>
  );
}

function DatasetHeader({ total, secondary, icon }: { total: number; secondary: string; icon: string }) {
  return (
    <div className="mb-5 rounded-md border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/20 text-emerald">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-3xl font-black text-white">{total.toLocaleString()}</p>
          <p className="text-sm font-bold text-white/65">{secondary}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/65">Run `npm run db:seed` after Supabase migration to move these records into editable admin tables.</p>
    </div>
  );
}

function DatasetTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
      <table className="w-full min-w-[840px] text-left text-sm">
        <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
          <tr>{headers.map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className="border-b border-white/10">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="max-w-[360px] truncate px-4 py-3 text-white/75">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
