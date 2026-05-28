import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourceEditor } from "@/components/admin/dataset-editors";
import { Icon } from "@/components/icon";
import { requireResourceAccess } from "@/lib/admin/auth";
import { getAdminResourceItem, getAdminResources } from "@/lib/admin/content";

export const metadata = {
  title: "Resources | Admin",
};

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireResourceAccess();
  const { edit } = await searchParams;
  const [resources, item] = await Promise.all([getAdminResources(context), getAdminResourceItem(edit, context)]);
  const files = resources.filter((resource) => resource.localUrl).length;

  return (
    <AdminShell context={context} title="Resources" description="Upload and manage the database-backed files shown on the public Resources page.">
      <div className="space-y-6">
        <DatasetHeader total={resources.length} secondary={`${files} uploaded files`} icon="download" />
        <ResourceTable resources={resources} />
        <ResourceEditor item={item} context={context} />
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
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/resources" target="_blank" className="rounded-md border border-emerald/40 px-4 py-2 text-sm font-black text-emerald hover:bg-emerald hover:text-white">
          View public page
        </Link>
        <Link href="/admin/resources" className="rounded-md border border-white/10 px-4 py-2 text-sm font-black text-white/75 hover:border-emerald/50 hover:text-white">
          New resource
        </Link>
      </div>
    </div>
  );
}

function ResourceTable({ resources }: { resources: Awaited<ReturnType<typeof getAdminResources>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
      <table className="w-full min-w-[940px] text-left text-sm">
        <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
          <tr>{["Title", "Status", "Subject", "Kind", "File", "Edit"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {resources.slice(0, 120).map((resource) => (
            <tr key={resource.id} className="border-b border-white/10">
              <td className="max-w-[320px] truncate px-4 py-3 font-black text-white">{resource.title}</td>
              <td className="px-4 py-3 text-white/75">{resource.status}</td>
              <td className="px-4 py-3 text-white/75">{resource.subject}</td>
              <td className="px-4 py-3 text-white/75">{resource.kind}</td>
              <td className="px-4 py-3 text-white/75">{resource.localUrl ? "Uploaded" : "Pending upload"}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/resources?edit=${encodeURIComponent(resource.id)}`} className="font-black text-emerald">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {resources.length === 0 ? (
        <div className="p-8 text-center text-sm font-bold text-white/60">
          No resources yet. Use the upload form below to add the first database-backed resource.
        </div>
      ) : null}
    </div>
  );
}
