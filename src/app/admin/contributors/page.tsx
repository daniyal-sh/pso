import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = {
  title: "Contributors | Admin",
};

export default async function AdminContributorsPage() {
  const context = await requireAdmin(["owner", "editor", "reviewer"]);
  const roles = [
    ["owner", "Full platform control, role management, publishing, audit access."],
    ["editor", "Create, edit, review, schedule, and publish content."],
    ["reviewer", "Review content and request changes without direct publishing."],
    ["contributor", "Create drafts and submit work for review."],
  ];

  return (
    <AdminShell context={context} title="Contributors" description="Role model and invite-only editorial governance.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map(([role, copy]) => (
          <article key={role} className="rounded-md border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase text-emerald">{role}</p>
            <p className="mt-4 text-sm leading-6 text-white/70">{copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/70">
        Add or promote users in `admin_roles`. The first owner can bootstrap through the migration policy; invite-code signup creates contributors by default.
      </div>
    </AdminShell>
  );
}
