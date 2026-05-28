"use client";

import { useActionState } from "react";
import { saveModeratorAccessAction } from "@/app/admin/actions";
import { adminSubjects, type ActionState, type ModeratorAdminItem } from "@/lib/admin/types";

const initialState: ActionState = { ok: false, message: "" };

export function ModeratorAccessForm({ member }: { member?: ModeratorAdminItem | null }) {
  const [state, action, pending] = useActionState(saveModeratorAccessAction, initialState);
  const resourceSubjects = member?.permissions.resourceSubjects ?? [];
  return (
    <form action={action} className="rounded-md border border-white/10 bg-white/5 p-5">
      <input type="hidden" name="memberId" value={member?.id ?? ""} />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase text-white/60">Email</span>
          <input name="email" type="email" required defaultValue={member?.email ?? ""} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-white/60">Display name</span>
          <input name="displayName" required defaultValue={member?.displayName ?? ""} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald" />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-white/60">Status</span>
          <select name="status" defaultValue={member?.status ?? "active"} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald">
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </select>
        </label>
        <label className="mt-7 flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 px-3 py-3 text-sm font-bold text-white/75">
          <input name="isOwner" type="checkbox" defaultChecked={member?.isOwner ?? false} />
          Owner access
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 px-3 py-3 text-sm font-bold text-white/75">
          <input name="canBlog" type="checkbox" defaultChecked={member?.permissions.blogs ?? false} disabled={member?.isOwner} />
          Blog moderator
        </label>
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 px-3 py-3 text-sm font-bold text-white/75">
          <input name="canGuide" type="checkbox" defaultChecked={member?.permissions.guides ?? false} disabled={member?.isOwner} />
          Guide moderator
        </label>
      </div>

      <fieldset className="mt-5 rounded-md border border-white/10 bg-[#061117]/50 p-4">
        <legend className="px-2 text-xs font-bold uppercase text-white/60">Resource subjects</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {adminSubjects.map((subject) => (
            <label key={subject} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/75">
              <input name="resourceSubjects" type="checkbox" value={subject} defaultChecked={resourceSubjects.includes(subject)} disabled={member?.isOwner} />
              {subject}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="mt-5 rounded-md bg-emerald px-4 py-3 text-sm font-black text-white disabled:opacity-60">
        {pending ? "Saving..." : member ? "Update access" : "Add moderator"}
      </button>
      {state.message ? <span className={state.ok ? "ml-3 text-sm font-bold text-emerald" : "ml-3 text-sm font-bold text-red-200"}>{state.message}</span> : null}
      {state.fieldErrors ? (
        <div className="mt-4 space-y-1 text-xs font-bold text-red-200">
          {Object.entries(state.fieldErrors).map(([field, errors]) => errors?.length ? <p key={field}>{field}: {errors.join(", ")}</p> : null)}
        </div>
      ) : null}
    </form>
  );
}

export const ContributorRoleForm = ModeratorAccessForm;
