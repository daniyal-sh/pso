"use client";

import { useActionState } from "react";
import { transitionContentAction } from "@/app/admin/actions";
import type { ActionState, ContentStatus } from "@/lib/admin/types";

const initialState: ActionState = { ok: false, message: "" };

export function TransitionForm({ id, status, options }: { id: string; status: ContentStatus; options: ContentStatus[] }) {
  const [state, action, pending] = useActionState(transitionContentAction, initialState);

  return (
    <form action={action} className="space-y-1">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="note" value="Changed from admin table." />
        <select name="status" defaultValue={status} aria-label="New status" className="rounded-md border border-white/10 bg-[#061117] px-2 py-2 text-xs font-bold text-white">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <button className="rounded-md bg-emerald px-3 py-2 text-xs font-black text-white disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? "Saving" : "Apply"}
        </button>
      </div>
      {state.message ? <p className={state.ok ? "text-xs font-bold text-emerald" : "text-xs font-bold text-red-200"}>{state.message}</p> : null}
    </form>
  );
}
