"use client";

import { useActionState } from "react";
import { saveContributorRoleAction } from "@/app/admin/actions";
import { adminRoles, type ContributorAdminItem } from "@/lib/admin/types";

const initialState = { ok: false, message: "" };

export function ContributorRoleForm({ contributor }: { contributor: ContributorAdminItem }) {
  const [state, action, pending] = useActionState(saveContributorRoleAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={contributor.userId} />
      <select name="role" defaultValue={contributor.role} className="rounded-md border border-white/10 bg-[#061117] px-3 py-2 text-xs font-bold text-white">
        {adminRoles.map((role) => (
          <option key={role}>{role}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 rounded-md border border-white/10 bg-[#061117] px-3 py-2 text-xs font-bold text-white/70">
        <input type="checkbox" name="requireMfa" defaultChecked={contributor.requireMfa} />
        MFA
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-emerald px-3 py-2 text-xs font-black text-white disabled:opacity-60">
        Save
      </button>
      {state.message ? <span className={state.ok ? "text-xs font-bold text-emerald" : "text-xs font-bold text-red-200"}>{state.message}</span> : null}
    </form>
  );
}
