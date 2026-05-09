import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { ContentTable } from "@/components/admin/content-table";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminContentItem, getAdminContentList } from "@/lib/admin/content";

export const metadata = {
  title: "Alumni Stories | Admin",
};

export default async function AdminAlumniPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const { edit } = await searchParams;
  const [items, item] = await Promise.all([getAdminContentList("alumni_story"), getAdminContentItem(edit, "alumni_story")]);

  return (
    <AdminShell context={context} title="Alumni Stories" description="Collect and review alumni narratives with the same secure draft/review/publish workflow.">
      <div className="space-y-6">
        <ContentTable items={items} editBasePath="/admin/alumni" />
        <ContentEditor kind="alumni_story" item={item} />
      </div>
    </AdminShell>
  );
}
