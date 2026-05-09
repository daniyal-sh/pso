import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { ContentTable } from "@/components/admin/content-table";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminContentItem, getAdminContentList } from "@/lib/admin/content";

export const metadata = {
  title: "Guides | Admin",
};

export default async function AdminGuidesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const { edit } = await searchParams;
  const [items, item] = await Promise.all([getAdminContentList("guide"), getAdminContentItem(edit, "guide")]);

  return (
    <AdminShell context={context} title="Guides" description="Maintain preparation roadmaps, source-backed guides, prerequisites, and linked references.">
      <div className="space-y-6">
        <ContentTable items={items} editBasePath="/admin/guides" />
        <ContentEditor kind="guide" item={item} />
      </div>
    </AdminShell>
  );
}
