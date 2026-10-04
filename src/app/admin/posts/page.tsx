import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { ContentTable } from "@/components/admin/content-table";
import { requireBlogAccess } from "@/lib/admin/auth";
import { getAdminContentItem, getAdminContentList } from "@/lib/admin/content";

export const metadata = {
  title: "Blog Posts | Admin",
};

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const context = await requireBlogAccess();
  const { edit } = await searchParams;
  const [items, item] = await Promise.all([getAdminContentList("blog_post", context), getAdminContentItem(edit, "blog_post", context)]);

  return (
    <AdminShell context={context} title="Blog Posts" description="Create, preview, review, schedule, and publish video-backed essays and announcements.">
      <div className="space-y-6">
        <ContentTable items={items} editBasePath="/admin/posts" context={context} />
        <ContentEditor key={item?.id ?? "new"} kind="blog_post" item={item} context={context} />
      </div>
    </AdminShell>
  );
}
