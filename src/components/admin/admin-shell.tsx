import Link from "next/link";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";
import { signOutAction } from "@/app/admin/actions";
import type { AdminContext } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard", scope: "all" },
  { href: "/admin/posts", label: "Blog Posts", icon: "file-text", scope: "blog" },
  { href: "/admin/guides", label: "Guides", icon: "book-open", scope: "guide" },
  { href: "/admin/resources", label: "Resources", icon: "download", scope: "resources" },
  { href: "/admin/contributors", label: "Access", icon: "users", scope: "owner" },
  { href: "/admin/analytics", label: "Analytics", icon: "activity", scope: "owner" },
  { href: "/admin/settings", label: "Settings", icon: "shield", scope: "owner" },
];

export function AdminShell({
  context,
  title,
  description,
  children,
}: {
  context: AdminContext;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  if (!context.isConfigured) {
    return <AdminSetup title={title} />;
  }
  const visibleNavItems = navItems.filter((item) => {
    if (item.scope === "all") return true;
    if (context.member?.isOwner) return true;
    if (item.scope === "blog") return context.permissions.blogs;
    if (item.scope === "guide") return context.permissions.guides;
    if (item.scope === "resources") return context.permissions.resourceSubjects.length > 0;
    return false;
  });

  return (
    <main className="min-h-screen bg-navy text-white admin-grid">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#061117]/95 p-6">
          <Logo />
          <nav className="mt-8 grid gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="science-field dark-panel mt-10 rounded-md p-5">
            <div className="relative z-10">
              <Icon name="shield" className="h-8 w-8 text-gold" />
              <h2 className="mt-6 text-lg font-black text-white">Secure editorial control</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">Access is scoped by role and every save is authorized server-side.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-white/10 bg-[#061117]/70 px-5 py-5 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald">Pakistan Olympiads Admin</p>
                <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-[260px] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55">
                  <Icon name="search" className="h-4 w-4" />
                  <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search content, authors, slugs..." />
                </label>
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span className="font-black text-white">{context.profile?.displayName ?? context.user?.email}</span>
                  <span className="ml-2 text-white/55">{context.member?.isOwner ? "owner" : "moderator"}</span>
                </div>
                <form action={signOutAction}>
                  <button className="rounded-md bg-emerald px-4 py-2 text-sm font-black text-white" type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>
          <div className="p-5 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

function AdminSetup({ title }: { title: string }) {
  const envRows = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CONTENT_REVALIDATION_SECRET",
  ];

  return (
    <main className="dark-panel science-field flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <section className="relative z-10 w-full max-w-4xl rounded-md border border-white/10 bg-navy/85 p-8 shadow-2xl">
        <Logo />
        <p className="mt-12 text-sm font-black uppercase text-gold">{title}</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-none text-white">Supabase setup required</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
          The admin dashboard is implemented, but it needs a Supabase project and Vercel environment variables before it can accept sign-ins or writes.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {envRows.map((row) => (
            <div key={row} className={cn("rounded-md border border-white/10 bg-white/5 p-4 font-mono text-xs", process.env[row] ? "text-emerald" : "text-white/65")}>
              {row}
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-md border border-gold/25 bg-gold/10 p-4 text-sm leading-6 text-white/75">
          Run the SQL migration in `supabase/migrations`, configure the Supabase email OTP template to include the numeric token, then add the first owner row in `admin_members`.
        </div>
      </section>
    </main>
  );
}
