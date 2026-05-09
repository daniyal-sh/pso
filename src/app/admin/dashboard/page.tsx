import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentTable } from "@/components/admin/content-table";
import { Icon } from "@/components/icon";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/content";

export const metadata = {
  title: "Admin Dashboard | Pakistan Olympiads",
};

export default async function AdminDashboardPage() {
  const context = await requireAdmin();
  const data = await getAdminDashboardData();
  const metrics = [
    { label: "Content", value: data.metrics.totalContent, icon: "file-text", detail: `${data.metrics.publishedContent} published` },
    { label: "Review Queue", value: data.metrics.reviewQueue, icon: "clipboard", detail: "Draft/review workflow" },
    { label: "Scheduled", value: data.metrics.scheduledContent, icon: "calendar", detail: "Future publishing" },
    { label: "Resources", value: data.metrics.resources, icon: "download", detail: "Indexed files" },
    { label: "Past Papers", value: data.metrics.pastPapers, icon: "book-open", detail: "Paper archive" },
    { label: "Questions", value: data.metrics.questions, icon: "list-checks", detail: "Practice items" },
  ];

  return (
    <AdminShell context={context} title="Dashboard" description="Secure editorial command center for Pakistan Olympiads.">
      <div className="space-y-6">
        {data.source === "fallback" ? (
          <div className="rounded-md border border-gold/25 bg-gold/10 p-4 text-sm font-bold text-gold">
            Supabase service role is not configured, so this dashboard is showing repository fallback data.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-md border border-white/10 bg-white/5 p-5 shadow-2xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/20 text-emerald">
                <Icon name={metric.icon} className="h-6 w-6" />
              </span>
              <p className="mt-4 text-3xl font-black text-white">{metric.value.toLocaleString()}</p>
              <p className="mt-1 text-sm font-bold text-white/75">{metric.label}</p>
              <p className="mt-3 text-xs font-bold text-emerald">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Create Post", "/admin/posts", "pen"],
            ["Add Guide", "/admin/guides", "book-open"],
            ["Review Questions", "/admin/question-bank", "clipboard"],
            ["View Audit", "/admin/audit", "shield"],
          ].map(([label, href, icon]) => (
            <Link key={label} href={href} className="flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 p-4 text-sm font-black text-white hover:border-emerald/50">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald/20 text-emerald">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}
        </div>

        <section className="rounded-md border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Recent Content</h2>
              <p className="mt-1 text-sm text-white/60">Drafts, reviews, scheduled content, and published posts/guides.</p>
            </div>
            <Link href="/admin/posts" className="text-sm font-black text-emerald">Manage posts</Link>
          </div>
          <ContentTable items={data.content} editBasePath="/admin/posts" />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-md border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-black text-white">Workflow Events</h2>
            <div className="mt-4 space-y-3">
              {data.workflowEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-white/10 bg-[#061117]/70 p-4">
                  <p className="text-sm font-black text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {event.fromStatus ?? "new"} {"->"} {event.toStatus}
                  </p>
                  {event.note ? <p className="mt-2 text-sm text-white/70">{event.note}</p> : null}
                </div>
              ))}
              {data.workflowEvents.length === 0 ? <p className="text-sm font-bold text-white/55">No workflow events yet.</p> : null}
            </div>
          </section>
          <section className="rounded-md border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-black text-white">Audit Trail</h2>
            <div className="mt-4 space-y-3">
              {data.auditLog.map((item) => (
                <div key={item.id} className="rounded-md border border-white/10 bg-[#061117]/70 p-4">
                  <p className="text-sm font-black text-white">{item.action}</p>
                  <p className="mt-1 text-xs text-white/60">{item.entityTable}:{item.entityId}</p>
                  <p className="mt-2 text-sm text-white/70">{item.summary}</p>
                </div>
              ))}
              {data.auditLog.length === 0 ? <p className="text-sm font-bold text-white/55">No audit entries yet.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
