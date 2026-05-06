import Link from "next/link";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";

export const metadata = {
  title: "Admin Login | Pakistan Olympiads",
};

export default function AdminLoginPage() {
  return (
    <main className="dark-panel science-field flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-md border border-white/10 bg-navy/80 shadow-2xl lg:grid-cols-[1fr_0.9fr]">
        <section className="p-8 sm:p-10">
          <Logo />
          <h1 className="mt-14 font-display text-5xl font-bold leading-none text-white">Admin access</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Moderators and contributors can review extracted questions, add solutions, manage guides, and publish resource updates from the dashboard.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Questions", "Guides", "Papers"].map((item, index) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                <Icon name={index === 0 ? "clipboard" : index === 1 ? "book-open" : "file-text"} className="h-6 w-6 text-gold" />
                <p className="mt-3 text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white p-8 text-charcoal sm:p-10">
          <h2 className="text-2xl font-black">Login / Sign up</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">Authentication is ready to connect to Supabase Auth or another provider.</p>
          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold">Email</span>
              <input className="mt-2 w-full rounded-md border border-navy/10 px-4 py-3 outline-none focus:border-emerald" placeholder="admin@pakistanolympiads.com" type="email" />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Password</span>
              <input className="mt-2 w-full rounded-md border border-navy/10 px-4 py-3 outline-none focus:border-emerald" placeholder="••••••••" type="password" />
            </label>
            <Link href="/admin/dashboard" className="flex min-h-12 items-center justify-center rounded-md bg-emerald px-5 text-sm font-black text-white shadow-lg shadow-emerald/20">
              Continue to dashboard
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
