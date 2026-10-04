"use client";

import { type FormEvent, useActionState, useRef, useState } from "react";
import { deleteResourceAction, saveResourceAction } from "@/app/admin/actions";
import { adminSubjects, type ActionState, type AdminContext, type ContentStatus, type ResourceAdminItem } from "@/lib/admin/types";

const initialState: ActionState = { ok: false, message: "" };
const statuses: ContentStatus[] = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"];
const resourceKinds = ["Book", "Guide", "Handout", "Problem Set", "Solution", "Syllabus", "Formula Sheet", "Other"];

// Uploaded files are stored as "/resources/<path>" and served by the storage route.
function publicResourceHref(localUrl: string) {
  return localUrl.startsWith("/resources/") ? `/api/storage/resource-files/${localUrl.slice("/resources/".length)}` : localUrl;
}

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
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFileKey, setUploadedFileKey] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const sizeBytesRef = useRef<HTMLInputElement>(null);
  const localUrlRef = useRef<HTMLInputElement>(null);
  const subjects = context.member?.isOwner ? adminSubjects : context.permissions.resourceSubjects;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData(event.currentTarget);
    const subject = String(formData.get("subject") ?? "");
    const title = String(formData.get("title") ?? "");
    const id = String(formData.get("id") ?? "");
    const fileKey = `${id}:${subject}:${title}:${file.name}:${file.size}:${file.lastModified}`;
    if (fileKey === uploadedFileKey) return;

    event.preventDefault();
    setUploading(true);
    setUploadMessage("Uploading file...");

    try {
      const response = await fetch("/api/admin/resources/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, subject, title, fileName: file.name, fileType: file.type, fileSize: file.size }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; resourceId?: string; signedUrl?: string; contentType?: string; localUrl?: string; sizeBytes?: number }
        | null;
      if (!response.ok || !result?.ok || !result.resourceId || !result.localUrl || !result.signedUrl) {
        throw new Error(result?.message || "Upload failed. Please try again.");
      }

      // Send the file straight to Supabase Storage using the one-time signed URL.
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const storageResponse = await fetch(result.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": result.contentType || file.type || "application/octet-stream",
          "x-upsert": "false",
          ...(anonKey ? { apikey: anonKey } : {}),
        },
        body: file,
      });
      if (!storageResponse.ok) {
        const detail = (await storageResponse.json().catch(() => null)) as { message?: string } | null;
        throw new Error(detail?.message ? `Upload failed: ${detail.message}` : "Upload failed. Please try again.");
      }
      if (idRef.current) idRef.current.value = result.resourceId;
      if (localUrlRef.current) localUrlRef.current.value = result.localUrl;
      if (sizeBytesRef.current) sizeBytesRef.current.value = String(result.sizeBytes ?? file.size);
      setUploadedFileKey(`${result.resourceId}:${subject}:${title}:${file.name}:${file.size}:${file.lastModified}`);
      setUploadMessage("File uploaded. Saving resource...");
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-white/10 bg-white/5 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-black text-white">{item ? "Edit resource" : "Upload resource"}</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">
            Upload a PDF or image, choose its subject, and publish it to the public Resources page. New resources can leave ID blank.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <input ref={idRef} type="hidden" name="id" defaultValue={item?.id ?? ""} />
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
          <input ref={sizeBytesRef} type="hidden" name="sizeBytes" defaultValue={item?.sizeBytes ?? 0} />
          <input ref={localUrlRef} type="hidden" name="localUrl" defaultValue={item?.localUrl ?? ""} />
          <input type="hidden" name="sourceUrl" value="" />
        </div>
        <div className="mt-4">
          <TextArea label="Description" name="description" value={item?.description} rows={4} />
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase text-white/60">Upload PDF or image</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
          />
        </label>
        {uploadMessage ? <p className={uploadMessage.includes("failed") || uploadMessage.includes("allowed") ? "mt-3 text-sm font-bold text-red-200" : "mt-3 text-sm font-bold text-emerald"}>{uploadMessage}</p> : null}
        {item?.localUrl ? (
          <a href={publicResourceHref(item.localUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex font-black text-emerald">
            Open attached file
          </a>
        ) : null}
      </section>
      <div className="space-y-4">
        <SavePanel state={state} pending={pending || uploading} label={uploading ? "Uploading..." : "Save resource"} />
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
