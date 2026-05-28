import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceEditor } from "@/components/admin/dataset-editors";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminResourceItem, getAdminResources } from "@/lib/admin/content";

export const metadata = {
  title: "Resources | Admin",
};

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const { edit } = await searchParams;
  const [resources, item] = await Promise.all([getAdminResources(), getAdminResourceItem(edit)]);
  const external = resources.filter((resource) => !resource.localUrl).length;

  return (
    <AdminShell context={context} title="Resources" description="Create, publish, archive, and correct student-facing resource metadata.">
      <div className="space-y-6">
        <DatasetHeader total={resources.length} secondary={`${external} external links`} icon="download" />
        <ResourceTable resources={resources} />
        <ResourceEditor item={item} />
      </div>
    </AdminShell>
  );
}

function DatasetHeader({ total, secondary, icon }: { total: number; secondary: string; icon: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/20 text-emerald">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-3xl font-black text-white">{total.toLocaleString()}</p>
          <p className="text-sm font-bold text-white/65">{secondary}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/65">When Supabase is configured this table is loaded from the production database.</p>
    </div>
  );
}

function ResourceTable({ resources }: { resources: Awaited<ReturnType<typeof getAdminResources>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
      <table className="w-full min-w-[940px] text-left text-sm">
        <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
          <tr>{["Title", "Status", "Subject", "Kind", "Storage", "Source", "Edit"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {resources.slice(0, 120).map((resource) => (
            <tr key={resource.id} className="border-b border-white/10">
              <td className="max-w-[320px] truncate px-4 py-3 font-black text-white">{resource.title}</td>
              <td className="px-4 py-3 text-white/75">{resource.status}</td>
              <td className="px-4 py-3 text-white/75">{resource.subject}</td>
              <td className="px-4 py-3 text-white/75">{resource.kind}</td>
              <td className="px-4 py-3 text-white/75">{resource.localUrl ? "Local file" : "External source"}</td>
              <td className="max-w-[260px] truncate px-4 py-3 text-white/75">{resource.sourceUrl || "Not attached"}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/resources?edit=${encodeURIComponent(resource.id)}`} className="font-black text-emerald">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
