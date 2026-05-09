"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { saveContentAction } from "@/app/admin/actions";
import { Icon } from "@/components/icon";
import type { ActionState, ContentEditorItem, ContentKind, ContentStatus } from "@/lib/admin/types";
import { calculateReadTime, slugify } from "@/lib/admin/schema";
import { cn } from "@/lib/utils";

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
  sourceUrl: string;
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  coverImageUrl: string;
  featured: boolean;
  status: ContentStatus;
  scheduledAt: string;
  tags: string;
  level: string;
};

function editorDefaults(kind: ContentKind, item?: ContentEditorItem | null): EditorFields {
  const metadata = item?.metadata ?? {};
  const tags = Array.isArray(metadata.tags) ? metadata.tags.join(", ") : "";
  return {
    title: item?.title ?? "",
    slug: item?.slug ?? "",
    excerpt: item?.excerpt ?? "",
    body: item?.body ?? "",
    category: item?.category ?? (kind === "blog_post" ? "NSTC" : "General"),
    authorName: item?.authorName ?? "Pakistan Olympiads Editorial Team",
    readTime: item?.readTime ?? "",
    sourceUrl: item?.sourceUrl ?? "",
    videoUrl: item?.videoUrl ?? "",
    videoId: item?.videoId ?? "",
    videoTitle: item?.videoTitle ?? "",
    coverImageUrl: item?.coverImageUrl ?? "",
    featured: item?.featured ?? false,
    status: item?.status ?? "draft",
    scheduledAt: item?.scheduledAt ?? "",
    tags,
    level: String(metadata.level ?? (kind === "guide" ? "Beginner" : "")),
  };
}

export function ContentEditor({ kind, item }: { kind: ContentKind; item?: ContentEditorItem | null }) {
  const [state, action, pending] = useActionState(saveContentAction, initialState);
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
      { label: "Video", ok: !fields.videoId || /^[a-zA-Z0-9_-]{11}$/.test(fields.videoId) },
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

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="kind" value={kind} />
      <section className="space-y-4">
        <div className="rounded-md border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Title" name="title" value={fields.title} onChange={(value) => updateField("title", value)} />
            <Field label="Slug" name="slug" value={fields.slug} onChange={(value) => updateField("slug", slugify(value))} />
            <Field label="Category" name="category" value={fields.category} onChange={(value) => updateField("category", value)} />
            <Field label="Author" name="authorName" value={fields.authorName} onChange={(value) => updateField("authorName", value)} />
            <Field label="Read time" name="readTime" value={fields.readTime} onChange={(value) => updateField("readTime", value)} />
            <Field label="Tags" name="tags" value={fields.tags} onChange={(value) => updateField("tags", value)} placeholder="Physics, NSTC, Roadmap" />
            {kind === "guide" ? <Field label="Level" name="level" value={fields.level} onChange={(value) => updateField("level", value)} /> : null}
            <label className="block">
              <span className="text-xs font-bold uppercase text-white/60">Status</span>
              <select
                name="status"
                className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
                value={fields.status}
                onChange={(event) => updateField("status", event.target.value as ContentStatus)}
              >
                {statuses.map((status) => (
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
              <h2 className="text-sm font-black uppercase text-charcoal">Live preview</h2>
              <span className="rounded-md bg-mint px-2 py-1 text-xs font-black text-emerald">Sanitized</span>
            </div>
            <div className="prose prose-sm max-w-none overflow-hidden break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {fields.body || "Preview appears as you write."}
              </ReactMarkdown>
            </div>
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
          <label className="mt-4 flex items-center gap-3 rounded-md border border-white/10 bg-[#061117]/70 px-3 py-3 text-sm font-bold text-white/75">
            <input name="featured" type="checkbox" checked={fields.featured} onChange={(event) => updateField("featured", event.target.checked)} />
            Featured content
          </label>
          <button className="mt-4 w-full rounded-md bg-emerald px-4 py-3 text-sm font-black text-white disabled:opacity-60" disabled={pending} type="submit">
            {pending ? "Saving..." : "Save content"}
          </button>
          {state.message ? <p className={state.ok ? "mt-4 text-sm font-bold text-emerald" : "mt-4 text-sm font-bold text-red-200"}>{state.message}</p> : null}
        </div>

        <div className="rounded-md border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-black uppercase text-white">Embeds and metadata</h2>
          <div className="mt-4 space-y-3">
            <Field label="Source URL" name="sourceUrl" value={fields.sourceUrl} onChange={(value) => updateField("sourceUrl", value)} />
            <Field label="YouTube URL" name="videoUrl" value={fields.videoUrl} onChange={(value) => updateField("videoUrl", value)} />
            <Field label="YouTube ID" name="videoId" value={fields.videoId} onChange={(value) => updateField("videoId", value)} />
            <Field label="Video title" name="videoTitle" value={fields.videoTitle} onChange={(value) => updateField("videoTitle", value)} />
            <Field label="Cover image URL" name="coverImageUrl" value={fields.coverImageUrl} onChange={(value) => updateField("coverImageUrl", value)} />
            <Field label="Scheduled publish ISO" name="scheduledAt" value={fields.scheduledAt} onChange={(value) => updateField("scheduledAt", value)} placeholder="2026-05-12T09:00:00.000Z" />
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/70">
          <h2 className="text-sm font-black uppercase text-white">Revision history</h2>
          <p className="mt-3">Every save writes a new `content_revisions` snapshot and an `audit_log` entry. Use the Audit Logs page to inspect production changes.</p>
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
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-white/60">{label}</span>
      <input
        name={name}
        className="mt-2 w-full rounded-md border border-white/10 bg-[#061117] px-3 py-3 text-sm text-white outline-none focus:border-emerald"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
