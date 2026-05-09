import { redirect } from "next/navigation";
import { AdminAuthForms } from "@/components/admin/admin-auth-forms";
import { AdminShell } from "@/components/admin/admin-shell";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata = {
  title: "Admin Login | Pakistan Olympiads",
};

export default async function AdminLoginPage() {
  const context = await getAdminContext();
  if (context.isConfigured && context.user && context.role) redirect("/admin/dashboard");

  if (!context.isConfigured) {
    return (
      <AdminShell context={context} title="Admin setup" description="Connect Supabase before using the secure admin dashboard.">
        <div />
      </AdminShell>
    );
  }

  return (
    <main className="dark-panel science-field flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-md border border-white/10 bg-navy/80 p-8 shadow-2xl">
          <Logo />
          <h1 className="mt-16 font-display text-5xl font-bold leading-none text-white">Admin access</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Moderators and contributors can publish posts, update guides, review extracted questions, manage papers, and keep the resource library safe.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Server auth", "RLS", "Audit log"].map((item, index) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                <Icon name={index === 0 ? "shield" : index === 1 ? "lock" : "activity"} className="h-6 w-6 text-gold" />
                <p className="mt-3 text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>
        <AdminAuthForms />
      </div>
    </main>
  );
}
