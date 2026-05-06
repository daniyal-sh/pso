import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";
import { adminRows } from "@/lib/data";

export const metadata = {
  title: "Admin Dashboard | Pakistan Olympiads",
};

const sidebar = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Posts", icon: "file-text" },
  { label: "Guides", icon: "book-open" },
  { label: "Question Bank", icon: "clipboard" },
  { label: "Past Papers", icon: "file-text" },
  { label: "Alumni Stories", icon: "users" },
  { label: "Contributors", icon: "users" },
  { label: "Analytics", icon: "activity" },
  { label: "Settings", icon: "shield" },
];

const metrics = [
  { label: "Total Resources", value: "1,256", icon: "book-open", change: "18% vs last month", tone: "text-emerald" },
  { label: "Pending Submissions", value: "34", icon: "clipboard", change: "8% vs last week", tone: "text-gold" },
  { label: "Published Posts", value: "892", icon: "file-text", change: "22% vs last month", tone: "text-emerald" },
  { label: "Active Contributors", value: "256", icon: "users", change: "16% vs last month", tone: "text-blue-300" },
  { label: "Questions to Approve", value: "78", icon: "lightbulb", change: "5% vs last week", tone: "text-red-300" },
];

const editors = [
  {
    title: "Blog Post Editor",
    icon: "pen",
    fields: ["Title", "Category", "Author", "Summary"],
    action: "Create post",
  },
  {
    title: "Guide / Resource Editor",
    icon: "book-open",
    fields: ["Guide title", "Track", "Source URL", "Difficulty"],
    action: "Save guide",
  },
  {
    title: "Question Editor",
    icon: "clipboard",
    fields: ["Prompt", "Subject", "Topic", "Correct option"],
    action: "Submit question",
  },
  {
    title: "Past Paper Metadata",
    icon: "file-text",
    fields: ["Exam", "Year", "Subject", "File URL"],
    action: "Upload metadata",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-navy text-white admin-grid">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#061117]/95 p-6">
          <Logo />
          <nav className="mt-8 space-y-1">
            {sidebar.map((item, index) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                  index === 0 ? "bg-emerald text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                type="button"
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="science-field dark-panel mt-12 rounded-md p-5">
            <div className="relative z-10">
              <Icon name="moonstar" className="h-8 w-8 text-gold" />
              <h2 className="mt-8 text-lg font-black text-white">Empowering future scientists of Pakistan</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">Maintain quality. Inspire excellence.</p>
            </div>
          </div>
        </aside>

        <section>
          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#061117]/70 px-6 py-5 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald">Admin Dashboard</p>
              <h1 className="mt-3 text-3xl font-black text-white">Welcome back, Admin</h1>
              <p className="mt-1 text-sm text-white/60">Here is what is happening on Pakistan Olympiads today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-[280px] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55">
                <Icon name="search" className="h-4 w-4" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search resources, users, posts..." />
              </label>
              <button className="rounded-md border border-white/10 px-4 py-2 text-sm font-bold text-white/80" type="button">
                May 12, 2024
              </button>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-md border border-white/10 bg-white/5 p-5 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-emerald/20 text-emerald">
                      <Icon name={metric.icon} className="h-7 w-7" />
                    </span>
                    <div>
                      <div className="text-3xl font-black text-white">{metric.value}</div>
                      <div className="text-sm text-white/70">{metric.label}</div>
                    </div>
                  </div>
                  <p className={`mt-4 text-sm font-bold ${metric.tone}`}>{metric.change}</p>
                  <div className="mt-4 flex h-8 items-end gap-1">
                    {[30, 46, 28, 62, 44, 70, 38, 64].map((height, index) => (
                      <span key={`${metric.label}-${index}`} className="w-full rounded-t bg-emerald/60" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-black text-white">Quick Actions</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {["Create Post", "Add Guide", "Upload Past Paper", "Approve Questions", "View All"].map((action, index) => (
                  <button key={action} className="flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 p-4 text-left" type="button">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/20 text-emerald">
                      <Icon name={["pen", "book-open", "download", "check", "eye"][index]} className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-white">{action}</span>
                      <span className="text-xs text-white/55">Manage content workflow</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-md border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-black text-white">Recent Posts & Guides</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="text-xs uppercase text-white/50">
                      <tr>
                        {["Title", "Type", "Author", "Status", "Date", "Views", "Actions"].map((header) => (
                          <th key={header} className="border-b border-white/10 py-3">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminRows.map((row) => (
                        <tr key={row.title} className="border-b border-white/10">
                          <td className="py-4 font-bold text-white">{row.title}</td>
                          <td>
                            <span className="rounded-full bg-emerald/20 px-3 py-1 text-xs font-black text-emerald">{row.type}</span>
                          </td>
                          <td className="text-white/70">{row.author}</td>
                          <td>
                            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-black text-gold">{row.status}</span>
                          </td>
                          <td className="text-white/70">{row.date}</td>
                          <td className="font-bold text-white">{row.views}</td>
                          <td className="text-white/70">...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-black text-white">Moderation Queue</h2>
                <div className="mt-4 space-y-3">
                  {["New Guide Submission", "Question Submission", "Past Paper Upload", "Blog Post Submission", "Question Submission"].map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-center justify-between rounded-md border border-white/10 bg-[#061117]/70 p-3">
                      <div className="flex items-center gap-3">
                        <Icon name={index % 2 === 0 ? "book-open" : "lightbulb"} className="h-5 w-5 text-gold" />
                        <div>
                          <p className="text-sm font-bold text-white">{item}</p>
                          <p className="text-xs text-white/55">By contributor</p>
                        </div>
                      </div>
                      <button className="rounded-md bg-emerald px-3 py-1.5 text-xs font-black text-white" type="button">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-4">
              {editors.map((editor) => (
                <form key={editor.title} className="rounded-md border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-gold/20 text-gold">
                      <Icon name={editor.icon} className="h-6 w-6" />
                    </span>
                    <h2 className="text-base font-black text-white">{editor.title}</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {editor.fields.map((field) => (
                      <label key={field} className="block">
                        <span className="text-xs font-bold text-white/60">{field}</span>
                        <input className="mt-1 w-full rounded-md border border-white/10 bg-[#061117]/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald" placeholder={field} />
                      </label>
                    ))}
                    <textarea className="min-h-24 w-full rounded-md border border-white/10 bg-[#061117]/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald" placeholder="Notes or MDX body" />
                    <button className="w-full rounded-md bg-emerald px-4 py-3 text-sm font-black text-white" type="button">
                      {editor.action}
                    </button>
                  </div>
                </form>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr_0.8fr]">
              <div className="rounded-md border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-black text-white">Analytics Overview</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ["Website Visitors", "32,842"],
                    ["Page Views", "89,120"],
                    ["Downloads", "12,456"],
                    ["New Signups", "1,256"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-white/10 bg-[#061117]/70 p-4">
                      <p className="text-xs text-white/55">{label}</p>
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="text-xs font-bold text-emerald">Up this month</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white">Growth</h2>
                  <span className="rounded-md border border-white/10 px-3 py-1 text-xs font-bold text-white/70">Last 30 Days</span>
                </div>
                <div className="mt-6 flex h-72 items-end gap-2 border-b border-l border-white/10 p-4">
                  {[35, 42, 55, 50, 62, 45, 58, 52, 70, 84, 49, 57, 66, 78].map((height, index) => (
                    <span key={index} className="w-full rounded-t bg-gradient-to-t from-emerald to-gold" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-black text-white">Contributor Activity</h2>
                <div className="mt-5 space-y-4">
                  {["Zainab R. published a guide", "Huzaifa A. submitted a post", "Ali Raza uploaded a paper", "Sara Khan joined the community"].map((activity) => (
                    <div key={activity} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-emerald" />
                      <p className="text-sm text-white/75">{activity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
