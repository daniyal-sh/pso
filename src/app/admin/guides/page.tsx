import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { ContentTable } from "@/components/admin/content-table";
import { requireGuideAccess } from "@/lib/admin/auth";
import { getAdminContentItem, getAdminContentList } from "@/lib/admin/content";

export const metadata = {
  title: "Guides | Admin",
};

export default async function AdminGuidesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireGuideAccess();
  const { edit } = await searchParams;
  const [items, item] = await Promise.all([getAdminContentList("guide", context), getAdminContentItem(edit, "guide", context)]);

  return (
    <AdminShell context={context} title="Guides" description="Maintain preparation roadmaps, source-backed guides, prerequisites, and linked references.">
      <div className="space-y-6">
        <ContentTable items={items} editBasePath="/admin/guides" context={context} />
        <ContentEditor key={item?.id ?? "new"} kind="guide" item={item} context={context} />
      </div>
    </AdminShell>
  );
}
