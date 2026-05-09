import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = {
  title: "Media Library | Admin",
};

export default async function AdminMediaPage() {
  const context = await requireAdmin(["owner", "editor", "contributor", "reviewer"]);
  const buckets = [
    { name: "content-assets", limit: "10 MB", types: "PNG, JPEG, WEBP, GIF", purpose: "Blog and guide imagery" },
    { name: "resource-files", limit: "50 MB", types: "PDF, PNG, JPEG, WEBP", purpose: "Student-facing resource files" },
    { name: "paper-assets", limit: "50 MB", types: "PDF, PNG, JPEG, WEBP", purpose: "Past-paper PDFs and page renders" },
  ];

  return (
    <AdminShell context={context} title="Media Library" description="Storage policy, upload buckets, and asset governance for content editors.">
      <div className="grid gap-4 md:grid-cols-3">
        {buckets.map((bucket) => (
          <article key={bucket.name} className="rounded-md border border-white/10 bg-white/5 p-5">
            <Icon name="bookmark" className="h-8 w-8 text-gold" />
            <h2 className="mt-4 font-mono text-lg font-black text-white">{bucket.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{bucket.purpose}</p>
            <div className="mt-4 space-y-2 text-xs font-bold text-white/60">
              <p>Limit: {bucket.limit}</p>
              <p>Allowed: {bucket.types}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-md border border-gold/25 bg-gold/10 p-5 text-sm leading-6 text-white/75">
        Upload mutations should stay server-side: validate MIME type and size, upload to Supabase Storage, then write `content_assets` rows for auditability.
      </div>
    </AdminShell>
  );
}
