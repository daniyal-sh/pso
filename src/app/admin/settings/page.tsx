import { AdminShell } from "@/components/admin/admin-shell";
import { requireOwner } from "@/lib/admin/auth";
import { getSupabaseConfig } from "@/lib/supabase/server";

export const metadata = {
  title: "Settings | Admin",
};

export default async function AdminSettingsPage() {
  const context = await requireOwner();
  const config = getSupabaseConfig();
  const checks = [
    ["Supabase URL", Boolean(config.url)],
    ["Anon key", Boolean(config.anonKey)],
    ["Service role key", Boolean(config.serviceRoleKey)],
    ["Revalidation secret", Boolean(process.env.CONTENT_REVALIDATION_SECRET)],
  ];

  return (
    <AdminShell context={context} title="Settings" description="Deployment readiness checklist for the secure admin system.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map(([label, ok]) => (
          <div key={String(label)} className="rounded-md border border-white/10 bg-white/5 p-5">
            <p className={ok ? "text-sm font-black text-emerald" : "text-sm font-black text-gold"}>{ok ? "Configured" : "Missing"}</p>
            <h2 className="mt-2 text-lg font-black text-white">{label}</h2>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
        <p>
          The OTP email template cannot be checked from here: confirm in Supabase Auth that the magic link template includes {"{{ .Token }}"}, and that public sign-ups are disabled.
        </p>
        <p className="mt-3">Deploy checklist: create Supabase project, run migration SQL, configure Auth redirect URLs, add Vercel env vars, run `npm run db:seed`, and verify `npm run verify` before making admin public.</p>
      </div>
    </AdminShell>
  );
}
