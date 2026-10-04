import { AdminShell } from "@/components/admin/admin-shell";
import { requireOwner } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/content";

export const metadata = {
  title: "Analytics | Admin",
};

export default async function AdminAnalyticsPage() {
  const context = await requireOwner();
  const data = await getAdminDashboardData(context);
  const rows = [
    ["Total content", data.metrics.totalContent],
    ["Published content", data.metrics.publishedContent],
    ["Review queue", data.metrics.reviewQueue],
    ["Scheduled content", data.metrics.scheduledContent],
    ["Resources", data.metrics.resources],
    ["Past papers", data.metrics.pastPapers],
    ["Questions", data.metrics.questions],
  ];

  return (
    <AdminShell context={context} title="Analytics" description="Current content and dataset counts. Traffic analytics are not collected.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-black text-white">{Number(value).toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold text-white/60">{label}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
