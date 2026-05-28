import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/icon";
import { requireAdminAccess } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/content";

export const metadata = {
  title: "Admin Dashboard | Pakistan Olympiads",
};

export default async function AdminDashboardPage() {
  const context = await requireAdminAccess();
  const data = await getAdminDashboardData(context);
  const metrics = [
    { label: "Content", value: data.metrics.totalContent, icon: "file-text", detail: `${data.metrics.publishedContent} published` },
    { label: "Review Queue", value: data.metrics.reviewQueue, icon: "clipboard", detail: "Draft/review workflow" },
    { label: "Scheduled", value: data.metrics.scheduledContent, icon: "calendar", detail: "Future publishing" },
    { label: "Resources", value: data.metrics.resources, icon: "download", detail: "Indexed files" },
  ];

  return (
    <AdminShell context={context} title="Dashboard" description="Secure editorial command center for Pakistan Olympiads.">
      <div className="space-y-6">
        {data.source === "unavailable" ? (
          <div className="rounded-md border border-gold/25 bg-gold/10 p-4 text-sm font-bold text-gold">
            Supabase service role is not configured, so database-backed content is unavailable.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="grid gap-3 md:grid-cols-3">
          {[
            ...(context.member?.isOwner || context.permissions.blogs ? [["Create Post", "/admin/posts", "pen"]] : []),
            ...(context.member?.isOwner || context.permissions.guides ? [["Add Guide", "/admin/guides", "book-open"]] : []),
            ...(context.member?.isOwner || context.permissions.resourceSubjects.length > 0 ? [["Upload Resource", "/admin/resources", "download"]] : []),
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
          <h2 className="text-lg font-black text-white">Manage PSO</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/60">
            Use the dashboard for blogs, guides, resource uploads, access control, analytics, and settings. Past papers and the question bank remain database-backed public datasets, but are no longer exposed as dashboard editing sections.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
