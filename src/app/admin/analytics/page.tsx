import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/content";

export const metadata = {
  title: "Analytics | Admin",
};

export default async function AdminAnalyticsPage() {
  const context = await requireAdmin(["owner", "editor", "reviewer"]);
  const data = await getAdminDashboardData();
  const rows = [
    ["Published content", data.metrics.publishedContent],
    ["Review queue", data.metrics.reviewQueue],
    ["Scheduled content", data.metrics.scheduledContent],
    ["Resources", data.metrics.resources],
    ["Past papers", data.metrics.pastPapers],
    ["Questions", data.metrics.questions],
  ];

  return (
    <AdminShell context={context} title="Analytics" description="Operational content signals for editorial planning.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-black text-white">{Number(value).toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold text-white/60">{label}</p>
            <div className="mt-4 flex h-16 items-end gap-1">
              {[34, 52, 40, 68, 58, 76, 49].map((height, index) => (
                <span key={index} className="w-full rounded-t bg-emerald/70" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
