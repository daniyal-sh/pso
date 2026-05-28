"use client";

import { useActionState } from "react";
import { savePastPaperAction, saveQuestionAction, saveResourceAction } from "@/app/admin/actions";
import type { ActionState, ContentStatus, PastPaperAdminItem, QuestionAdminItem, ResourceAdminItem } from "@/lib/admin/types";

const initialState: ActionState = { ok: false, message: "" };
const statuses: ContentStatus[] = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"];

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

export function ResourceEditor({ item }: { item?: ResourceAdminItem | null }) {
  const [state, action, pending] = useActionState(saveResourceAction, initialState);
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField label="ID" name="id" value={item?.id} />
          <StatusField value={item?.status} />
          <TextField label="Title" name="title" value={item?.title} />
          <TextField label="Subject" name="subject" value={item?.subject} />
          <TextField label="Kind" name="kind" value={item?.kind} />
          <TextField label="Folder" name="folder" value={item?.folder} />
          <TextField label="Year" name="year" value={item?.year} type="number" />
          <TextField label="Pages" name="pages" value={item?.pages ?? 0} type="number" />
          <TextField label="Size bytes" name="sizeBytes" value={item?.sizeBytes ?? 0} type="number" />
          <TextField label="Local URL" name="localUrl" value={item?.localUrl} />
          <TextField label="Source URL" name="sourceUrl" value={item?.sourceUrl} />
        </div>
        <div className="mt-4">
          <TextArea label="Description" name="description" value={item?.description} rows={4} />
        </div>
      </section>
      <SavePanel state={state} pending={pending} label="Save resource" />
    </form>
  );
}

export function PastPaperEditor({ item }: { item?: PastPaperAdminItem | null }) {
  const [state, action, pending] = useActionState(savePastPaperAction, initialState);
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField label="ID" name="id" value={item?.id} />
          <StatusField value={item?.status} />
          <TextField label="Title" name="title" value={item?.title} />
          <TextField label="Exam" name="exam" value={item?.exam ?? "NSTC"} />
          <TextField label="Subject" name="subject" value={item?.subject} />
          <TextField label="Year" name="year" value={item?.year} type="number" />
          <TextField label="Pages" name="pages" value={item?.pages ?? 0} type="number" />
          <TextField label="Question count" name="questionCount" value={item?.questionCount ?? 0} type="number" />
          <TextField label="MCQ count" name="mcqCount" value={item?.mcqCount ?? 0} type="number" />
          <TextField label="Descriptive count" name="descriptiveCount" value={item?.descriptiveCount ?? 0} type="number" />
          <TextField label="Part I count" name="partICount" value={item?.partICount ?? 0} type="number" />
          <TextField label="Part II count" name="partIICount" value={item?.partIICount ?? 0} type="number" />
          <TextField label="Resource URL" name="resourceUrl" value={item?.resourceUrl} />
          <TextField label="Source URL" name="sourceUrl" value={item?.sourceUrl} />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 px-3 py-3 text-sm font-bold text-white/75">
          <input name="scanned" type="checkbox" defaultChecked={item?.scanned ?? false} />
          Camera scan / OCR review needed
        </label>
        <div className="mt-4">
          <TextArea label="Page image URLs, one per line" name="pageImages" value={(item?.pageImages ?? []).join("\n")} rows={8} />
        </div>
      </section>
      <SavePanel state={state} pending={pending} label="Save paper" />
    </form>
  );
}

export function QuestionEditor({ item }: { item?: QuestionAdminItem | null }) {
  const [state, action, pending] = useActionState(saveQuestionAction, initialState);
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField label="ID" name="id" value={item?.id} />
          <StatusField value={item?.status} />
          <TextField label="Paper ID" name="paperId" value={item?.paperId} />
          <TextField label="Paper subject" name="paperSubject" value={item?.paperSubject} />
          <TextField label="Number" name="number" value={item?.number} type="number" />
          <TextField label="Display number" name="displayNumber" value={item?.displayNumber} />
          <TextField label="Subject" name="subject" value={item?.subject} />
          <TextField label="Topic" name="topic" value={item?.topic} />
          <TextField label="Difficulty" name="difficulty" value={item?.difficulty} />
          <label className="block">
            <span className="text-xs font-bold uppercase text-white/60">Type</span>
            <select name="type" defaultValue={item?.type ?? "MCQ"} className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald">
              <option>MCQ</option>
              <option>Long</option>
            </select>
          </label>
          <TextField label="Section" name="section" value={item?.section} />
          <TextField label="Section title" name="sectionTitle" value={item?.sectionTitle} />
          <TextField label="Exam" name="exam" value={item?.exam ?? "NSTC"} />
          <TextField label="Year" name="year" value={item?.year} type="number" />
          <TextField label="Source" name="source" value={item?.source} />
          <TextField label="Answer index, 0-3" name="answer" value={item?.answer} type="number" />
          <TextField label="Page" name="page" value={item?.page} type="number" />
          <TextField label="Figure URL" name="figure" value={item?.figure} />
        </div>
        <div className="mt-4 space-y-4">
          <TextArea label="Prompt" name="prompt" value={item?.prompt} rows={8} />
          <TextArea label="Options, one per line" name="options" value={(item?.options ?? []).join("\n")} rows={5} />
          <TextArea label="Solution / answer notes" name="solution" value={item?.solution} rows={8} />
        </div>
      </section>
      <SavePanel state={state} pending={pending} label="Save question" />
    </form>
  );
}
