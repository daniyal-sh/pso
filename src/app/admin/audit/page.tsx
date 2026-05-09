import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/content";

export const metadata = {
  title: "Audit Logs | Admin",
};

export default async function AdminAuditPage() {
  const context = await requireAdmin(["owner"]);
  const data = await getAdminDashboardData();

  return (
    <AdminShell context={context} title="Audit Logs" description="Owner-only trail of admin-sensitive content mutations.">
      <div className="overflow-x-auto rounded-md border border-white/10 bg-white/5">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#061117]/70 text-xs uppercase text-white/50">
            <tr>{["Action", "Entity", "Summary", "Created"].map((header) => <th key={header} className="border-b border-white/10 px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {data.auditLog.map((item) => (
              <tr key={item.id} className="border-b border-white/10">
                <td className="px-4 py-3 font-black text-white">{item.action}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/60">{item.entityTable}:{item.entityId}</td>
                <td className="px-4 py-3 text-white/75">{item.summary}</td>
                <td className="px-4 py-3 text-white/60">{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.auditLog.length === 0 ? <p className="p-8 text-center text-sm font-bold text-white/55">No audit entries yet.</p> : null}
      </div>
    </AdminShell>
  );
}
