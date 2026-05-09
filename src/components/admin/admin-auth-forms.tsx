"use client";

import { useActionState } from "react";
import { inviteSignupAction, signInAction } from "@/app/admin/actions";
import type { ActionState } from "@/lib/admin/types";

const initialState: ActionState = {
  ok: false,
  message: "",
};

export function AdminAuthForms() {
  const [loginState, loginAction, loginPending] = useActionState(signInAction, initialState);
  const [inviteState, inviteAction, invitePending] = useActionState(inviteSignupAction, initialState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={loginAction} className="rounded-md border border-navy/10 bg-white p-6 text-charcoal shadow-xl">
        <h2 className="text-2xl font-black">Sign in</h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/65">Use your Supabase admin account. Roles are enforced again on the server for every action.</p>
        <label className="mt-6 block">
          <span className="text-sm font-bold">Email</span>
          <input name="email" className="mt-2 w-full rounded-md border border-navy/10 px-4 py-3 outline-none focus:border-emerald" type="email" autoComplete="email" required />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold">Password</span>
          <input name="password" className="mt-2 w-full rounded-md border border-navy/10 px-4 py-3 outline-none focus:border-emerald" type="password" autoComplete="current-password" required />
        </label>
        {loginState.message ? <p className={loginState.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-600"}>{loginState.message}</p> : null}
        <button className="mt-6 w-full rounded-md bg-emerald px-5 py-3 text-sm font-black text-white disabled:opacity-60" disabled={loginPending} type="submit">
          {loginPending ? "Signing in..." : "Continue to dashboard"}
        </button>
      </form>

      <form action={inviteAction} className="rounded-md border border-white/10 bg-navy/70 p-6 text-white shadow-xl">
        <h2 className="text-2xl font-black">Invite-only signup</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">Creates a contributor account after the invite code is verified. Owners can promote roles in Supabase.</p>
        <label className="mt-6 block">
          <span className="text-sm font-bold">Name</span>
          <input name="displayName" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald" required />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold">Email</span>
          <input name="email" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald" type="email" autoComplete="email" required />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold">Password</span>
          <input name="password" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald" type="password" autoComplete="new-password" required />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold">Invite code</span>
          <input name="inviteCode" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald" required />
        </label>
        {inviteState.message ? <p className={inviteState.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-200"}>{inviteState.message}</p> : null}
        <button className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-black text-navy disabled:opacity-60" disabled={invitePending} type="submit">
          {invitePending ? "Creating..." : "Create contributor account"}
        </button>
      </form>
    </div>
  );
}
