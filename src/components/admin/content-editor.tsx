"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { deleteContentAction, saveContentAction } from "@/app/admin/actions";
import { Icon } from "@/components/icon";
import { MarkdownRenderer } from "@/components/sections/markdown-renderer";
import type { ActionState, AdminContext, ContentEditorItem, ContentKind, ContentStatus } from "@/lib/admin/types";
import { calculateReadTime, slugify } from "@/lib/admin/schema";
import { cn } from "@/lib/utils";
import { adminSubjects } from "@/lib/subjects";

const initialState: ActionState = {
  ok: false,
  message: "",
};

const statuses: ContentStatus[] = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"];

type EditorFields = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  authorName: string;
  readTime: string;
  featured: boolean;
  status: ContentStatus;
  scheduledAt: string;
};

function editorDefaults(kind: ContentKind, item?: ContentEditorItem | null): EditorFields {
  return {
    title: item?.title ?? "",
    slug: item?.slug ?? "",
    excerpt: item?.excerpt ?? "",
    body: item?.body ?? "",
    category: item?.category ?? (kind === "blog_post" ? "NSTC" : "General"),
    authorName: item?.authorName ?? "Pakistan Olympiads Editorial Team",
    readTime: item?.readTime ?? "",
    featured: item?.featured ?? false,
    status: item?.status ?? "draft",
    scheduledAt: item?.scheduledAt ?? "",
  };
}

export function ContentEditor({ kind, item, context }: { kind: ContentKind; item?: ContentEditorItem | null; context: AdminContext }) {
  const [state, action, pending] = useActionState(saveContentAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteContentAction, initialState);
  const [previewTab, setPreviewTab] = useState<"writing" | "rendered">("writing");
  const storageKey = `pso-admin-editor:${kind}:${item?.id ?? "new"}`;
  const [fields, setFields] = useState<EditorFields>(() => {
    const defaults = editorDefaults(kind, item);
    if (typeof window === "undefined" || item) return defaults;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(fields));
    }, 500);
    return () => window.clearTimeout(id);
  }, [fields, storageKey]);

  const checklist = useMemo(
    () => [
      { label: "Title", ok: fields.title.trim().length >= 4 },
      { label: "Slug", ok: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug) },
      { label: "Summary", ok: fields.excerpt.trim().length >= 20 },
      { label: "Body", ok: fields.body.trim().length >= 50 },
    ],
    [fields],
  );

  function updateField<Key extends keyof EditorFields>(key: Key, value: EditorFields[Key]) {
    setFields((previous) => ({
      ...previous,
      [key]: value,
      slug: key === "title" && !item ? slugify(String(value)) : previous.slug,
      readTime: key === "body" ? calculateReadTime(String(value)) : previous.readTime,
    }));
  }

  const canHardDelete = Boolean(context.member?.isOwner && item);
  const availableStatuses = statuses.filter((status) => context.member?.isOwner || status !== "scheduled");

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="sourceUrl" value="" />
      <input type="hidden" name="videoUrl" value="" />
      <input type="hidden" name="videoId" value="" />
      <input type="hidden" name="videoTitle" value="" />
      <input type="hidden" name="coverImageUrl" value="" />
      <input type="hidden" name="featured" value="false" />
      <input type="hidden" name="scheduledAt" value="" />
      <input type="hidden" name="tags" value="" />
      <input type="hidden" name="level" value="" />
      <section className="space-y-4">
        <div className="rounded-md border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Title" name="title" value={fields.title} onChange={(value) => updateField("title", value)} />
            <Field label="Slug" name="slug" value={fields.slug} onChange={(value) => updateField("slug", slugify(value))} />
            <Field label="Category" name="category" value={fields.category} suggestions={["General", "NSTC", ...adminSubjects]} onChange={(value) => updateField("category", value)} />
            <Field label="Author" name="authorName" value={fields.authorName} onChange={(value) => updateField("authorName", value)} />
            <Field label="Read time" name="readTime" value={fields.readTime} onChange={(value) => updateField("readTime", value)} />
            <label className="block">
              <span className="text-xs font-bold uppercase text-white/60">Status</span>
              <select
                name="status"
                className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
                value={fields.status}
                onChange={(event) => updateField("status", event.target.value as ContentStatus)}
              >
                {availableStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase text-white/60">Summary</span>
            <textarea
              name="excerpt"
              className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
              value={fields.excerpt}
              onChange={(event) => updateField("excerpt", event.target.value)}
            />
          </label>
        </div>

        <div className="grid min-h-[620px] gap-4 rounded-md border border-white/10 bg-white/5 p-5 lg:grid-cols-2">
          <label className="flex min-h-0 flex-col">
            <span className="text-xs font-bold uppercase text-white/60">MDX body</span>
            <textarea
              name="body"
              className="mt-2 min-h-[520px] flex-1 resize-y rounded-md border border-white/10 bg-[#061117] p-4 font-mono text-sm leading-7 text-white outline-none focus:border-emerald"
              value={fields.body}
              onChange={(event) => updateField("body", event.target.value)}
              placeholder="Write Markdown/MDX with headings, lists, links, and whitelisted embeds."
            />
          </label>
          <div className="min-w-0 overflow-hidden rounded-md border border-white/10 bg-white p-4 text-charcoal">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-navy/10 pb-3">
              <h2 className="text-sm font-black uppercase text-charcoal">Preview</h2>
              <div className="flex gap-1">
                {(["writing", "rendered"] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setPreviewTab(tab)} className={cn("rounded-md px-2 py-1 text-xs font-black capitalize", previewTab === tab ? "bg-emerald text-white" : "bg-mint text-emerald")}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            {previewTab === "writing" ? <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-charcoal/75">{fields.body || "Preview appears as you write."}</pre> : null}
            {previewTab === "rendered" ? <MarkdownRenderer content={fields.body || "Preview appears as you write."} /> : null}
          </div>
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-md border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-black uppercase text-white">Publish checklist</h2>
          <div className="mt-4 grid gap-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-white/10 bg-[#061117]/70 px-3 py-2">
                <span className="text-sm font-bold text-white/75">{item.label}</span>
                <Icon name={item.ok ? "check" : "timer"} className={cn("h-4 w-4", item.ok ? "text-emerald" : "text-gold")} />
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-md bg-emerald px-4 py-3 text-sm font-black text-white disabled:opacity-60" disabled={pending} type="submit">
            {pending ? "Saving..." : "Save content"}
          </button>
          {state.message ? <p className={state.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-200"}>{state.message}</p> : null}
        </div>

        {canHardDelete ? (
          <div className="rounded-md border border-red-400/30 bg-red-950/20 p-5">
            <h2 className="text-sm font-black uppercase text-red-100">Owner delete</h2>
            <p className="mt-2 text-sm leading-6 text-red-100/70">Hard delete removes the content row after writing an audit entry.</p>
            <button type="submit" formAction={deleteAction} disabled={deletePending} className="mt-4 rounded-md bg-red-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
              {deletePending ? "Deleting..." : "Delete content"}
            </button>
            {deleteState.message ? <p className={deleteState.ok ? "mt-3 text-sm font-bold text-emerald" : "mt-3 text-sm font-bold text-red-200"}>{deleteState.message}</p> : null}
          </div>
        ) : null}

        <div className="rounded-md border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/70">
          <h2 className="text-sm font-black uppercase text-white">Revision history</h2>
          <p className="mt-3">Every save writes a new revision snapshot for this post or guide.</p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  suggestions,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  suggestions?: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-white/60">{label}</span>
      <input
        name={name}
        list={suggestions ? `${name}-suggestions` : undefined}
        className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {suggestions ? (
        <datalist id={`${name}-suggestions`}>
          {suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
      ) : null}
    </label>
  );
}
