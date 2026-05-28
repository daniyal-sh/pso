import { AdminShell } from "@/components/admin/admin-shell";
import { ContributorRoleForm } from "@/components/admin/contributor-role-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminContributors } from "@/lib/admin/content";

export const metadata = {
  title: "Contributors | Admin",
};

export default async function AdminContributorsPage() {
  const context = await requireAdmin(["owner", "editor", "reviewer"]);
  const contributors = await getAdminContributors();
  const roles = [
    ["owner", "Full platform control, role management, publishing, audit access."],
    ["editor", "Create, edit, review, schedule, and publish content."],
    ["reviewer", "Review content and request changes without direct publishing."],
    ["contributor", "Create drafts and submit work for review."],
  ];

  return (
    <AdminShell context={context} title="Contributors" description="Role model and invite-only editorial governance.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roles.map(([role, copy]) => (
            <article key={role} className="rounded-md border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase text-emerald">{role}</p>
              <p className="mt-4 text-sm leading-6 text-white/70">{copy}</p>
            </article>
          ))}
        </div>

        <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
              <tr>{["Contributor", "Email", "Role", "MFA", "Updated", "Manage"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
            </thead>
            <tbody>
              {contributors.map((contributor) => (
                <tr key={contributor.userId} className="border-b border-white/10">
                  <td className="px-4 py-3 font-black text-white">{contributor.displayName}</td>
                  <td className="px-4 py-3 text-white/70">{contributor.email || contributor.userId}</td>
                  <td className="px-4 py-3 text-white/70">{contributor.role}</td>
                  <td className="px-4 py-3 text-white/70">{contributor.requireMfa ? "Required" : "Optional"}</td>
                  <td className="px-4 py-3 text-white/70">{contributor.updatedAt}</td>
                  <td className="px-4 py-3">{context.role === "owner" ? <ContributorRoleForm contributor={contributor} /> : <span className="text-white/45">Owner only</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contributors.length === 0 ? <div className="p-8 text-center text-sm font-bold text-white/60">No admin users found. Use invite signup or insert the first owner in Supabase.</div> : null}
        </div>
      </div>
    </AdminShell>
  );
}
