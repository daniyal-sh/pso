"use client";

import { useActionState } from "react";
import { deleteResourceAction, saveResourceAction } from "@/app/admin/actions";
import { adminSubjects, type ActionState, type AdminContext, type ContentStatus, type ResourceAdminItem } from "@/lib/admin/types";

const initialState: ActionState = { ok: false, message: "" };
const statuses: ContentStatus[] = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"];
const resourceKinds = ["Book", "Guide", "Handout", "Problem Set", "Solution", "Syllabus", "Formula Sheet", "Other"];

function StatusField({ value = "published" }: { value?: ContentStatus }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-white/60">Status</span>
      <select name="status" defaultValue={value} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald">
        {statuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, name, value = "", type = "text" }: { label: string; name: string; value?: string | number | null; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-white/60">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
      />
    </label>
  );
}

function TextArea({ label, name, value = "", rows = 5 }: { label: string; name: string; value?: string | null; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-white/60">{label}</span>
      <textarea
        name={name}
        defaultValue={value ?? ""}
        rows={rows}
        className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-emerald"
      />
    </label>
  );
}

function SavePanel({ state, pending, label }: { state: ActionState; pending: boolean; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-5">
      <button type="submit" disabled={pending} className="w-full rounded-md bg-emerald px-4 py-3 text-sm font-black text-white disabled:opacity-60">
        {pending ? "Saving..." : label}
      </button>
      {state.message ? <p className={state.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-200"}>{state.message}</p> : null}
      {state.fieldErrors ? (
        <div className="mt-4 space-y-1 text-xs font-bold text-red-200">
          {Object.entries(state.fieldErrors).map(([field, errors]) => errors?.length ? <p key={field}>{field}: {errors.join(", ")}</p> : null)}
        </div>
      ) : null}
    </div>
  );
}

export function ResourceEditor({ item, context }: { item?: ResourceAdminItem | null; context: AdminContext }) {
  const [state, action, pending] = useActionState(saveResourceAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteResourceAction, initialState);
  const subjects = context.member?.isOwner ? adminSubjects : context.permissions.resourceSubjects;
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-white/10 bg-white/5 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-black text-white">{item ? "Edit resource" : "Upload resource"}</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">
            Upload a PDF or image, choose its subject, and publish it to the public Resources page. New resources can leave ID blank.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <StatusField value={item?.status} />
          <TextField label="Title" name="title" value={item?.title} />
          <label className="block">
            <span className="text-xs font-bold uppercase text-white/60">Subject</span>
            <select name="subject" defaultValue={item?.subject ?? subjects[0]} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald">
              {subjects.map((subject) => (
                <option key={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-white/60">Kind</span>
            <select name="kind" defaultValue={item?.kind ?? "Guide"} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald">
              {resourceKinds.map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <input type="hidden" name="folder" value="" />
          <input type="hidden" name="year" value="" />
          <input type="hidden" name="pages" value="0" />
          <input type="hidden" name="sizeBytes" value={item?.sizeBytes ?? 0} />
          <input type="hidden" name="localUrl" value={item?.localUrl ?? ""} />
          <input type="hidden" name="sourceUrl" value="" />
        </div>
        <div className="mt-4">
          <TextArea label="Description" name="description" value={item?.description} rows={4} />
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase text-white/60">Upload PDF or image</span>
          <input
            name="resourceFile"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
          />
        </label>
        {item?.localUrl ? (
          <a href={item.localUrl} target="_blank" className="mt-4 inline-flex font-black text-emerald">
            Open attached file
          </a>
        ) : null}
      </section>
      <div className="space-y-4">
        <SavePanel state={state} pending={pending} label="Save resource" />
        {context.member?.isOwner && item ? (
          <div className="rounded-md border border-red-400/30 bg-red-950/20 p-5">
            <button type="submit" formAction={deleteAction} disabled={deletePending} className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
              {deletePending ? "Deleting..." : "Delete resource"}
            </button>
            {deleteState.message ? <p className={deleteState.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-200"}>{deleteState.message}</p> : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
