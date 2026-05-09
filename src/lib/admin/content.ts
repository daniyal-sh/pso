import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { blogPosts } from "@/lib/data";
import { getAllGuides } from "@/lib/guides";
import { pastPapers, questions, resources } from "@/lib/content-data";
import type { AdminContext, AdminDashboardData, AdminRole, ContentEditorItem, ContentKind, ContentListItem, ContentStatus } from "@/lib/admin/types";
import { getSupabaseConfig, getSupabaseServiceClient } from "@/lib/supabase/server";

type ContentRow = {
  id: string;
  kind: ContentKind;
  status: ContentStatus;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  category: string;
  author_name: string;
  read_time: string;
  source_url?: string;
  video_url?: string;
  video_id?: string;
  video_title?: string;
  cover_image_url?: string;
  featured: boolean;
  metadata?: Record<string, unknown>;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
};

type ContentMutation = {
  id?: string;
  kind: ContentKind;
  status: ContentStatus;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  authorName: string;
  readTime: string;
  sourceUrl?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  coverImageUrl?: string;
  featured?: boolean;
  scheduledAt?: string;
  metadata: Record<string, unknown>;
};

const publishableRoles: AdminRole[] = ["owner", "editor"];
const writerRoles: AdminRole[] = ["owner", "editor", "contributor"];

function toListItem(row: ContentRow): ContentListItem {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    authorName: row.author_name,
    readTime: row.read_time,
    featured: row.featured,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
  };
}

function toEditorItem(row: ContentRow): ContentEditorItem {
  return {
    ...toListItem(row),
    body: row.body ?? "",
    sourceUrl: row.source_url ?? "",
    videoUrl: row.video_url ?? "",
    videoId: row.video_id ?? "",
    videoTitle: row.video_title ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    metadata: row.metadata ?? {},
  };
}

function fallbackContent(): ContentListItem[] {
  const blog = blogPosts.map((post, index) => ({
    id: `fallback-blog-${post.slug}`,
    kind: "blog_post" as const,
    status: "published" as const,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    authorName: post.author,
    readTime: post.read,
    featured: index === 0,
    updatedAt: post.date,
    publishedAt: post.date,
    scheduledAt: null,
  }));
  const guides = getAllGuides().map((guide) => ({
    id: `fallback-guide-${guide.slug}`,
    kind: "guide" as const,
    status: "published" as const,
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.description,
    category: guide.category,
    authorName: guide.author,
    readTime: guide.readTime,
    featured: guide.featured,
    updatedAt: guide.updated,
    publishedAt: guide.updated,
    scheduledAt: null,
  }));
  return [...blog, ...guides];
}

function assertRole(context: AdminContext, allowed: AdminRole[]) {
  if (!context.user || !context.role || !allowed.includes(context.role)) {
    throw new Error("You are not allowed to perform this admin action.");
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) {
    const content = fallbackContent();
    return {
      source: "fallback",
      metrics: {
        totalContent: content.length,
        publishedContent: content.length,
        reviewQueue: 0,
        scheduledContent: 0,
        resources: resources.length,
        pastPapers: pastPapers.length,
        questions: questions.length,
        admins: 0,
      },
      content: content.slice(0, 8),
      workflowEvents: [],
      auditLog: [],
    };
  }

  const [contentResult, resourcesResult, papersResult, questionsResult, adminsResult, workflowResult, auditResult] = await Promise.all([
    supabase.from("content_items").select("id,kind,status,slug,title,excerpt,category,author_name,read_time,featured,scheduled_at,published_at,updated_at").order("updated_at", { ascending: false }).limit(20),
    supabase.from("resources").select("id", { count: "exact", head: true }),
    supabase.from("past_papers").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("admin_roles").select("user_id", { count: "exact", head: true }),
    supabase.from("workflow_events").select("id,from_status,to_status,note,created_at,content_items(title)").order("created_at", { ascending: false }).limit(8),
    supabase.from("audit_log").select("id,action,entity_table,entity_id,summary,created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const content = ((contentResult.data ?? []) as ContentRow[]).map(toListItem);
  return {
    source: "supabase",
    metrics: {
      totalContent: content.length,
      publishedContent: content.filter((item) => item.status === "published").length,
      reviewQueue: content.filter((item) => item.status === "in_review" || item.status === "changes_requested").length,
      scheduledContent: content.filter((item) => item.status === "scheduled").length,
      resources: resourcesResult.count ?? 0,
      pastPapers: papersResult.count ?? 0,
      questions: questionsResult.count ?? 0,
      admins: adminsResult.count ?? 0,
    },
    content,
    workflowEvents: (workflowResult.data ?? []).map((event) => {
      const row = event as unknown as {
        id: string;
        from_status: ContentStatus | null;
        to_status: ContentStatus;
        note: string;
        created_at: string;
        content_items: { title: string } | null;
      };
      return {
        id: row.id,
        title: row.content_items?.title ?? "Content item",
        fromStatus: row.from_status,
        toStatus: row.to_status,
        note: row.note,
        createdAt: row.created_at,
      };
    }),
    auditLog: (auditResult.data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      entityTable: row.entity_table,
      entityId: row.entity_id,
      summary: row.summary,
      createdAt: row.created_at,
    })),
  };
}

export async function getAdminContentList(kind?: ContentKind) {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) {
    return fallbackContent().filter((item) => !kind || item.kind === kind);
  }

  let query = supabase.from("content_items").select("id,kind,status,slug,title,excerpt,category,author_name,read_time,featured,scheduled_at,published_at,updated_at").order("updated_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as ContentRow[]).map(toListItem);
}

export async function getAdminContentItem(id?: string, kind: ContentKind = "blog_post") {
  const supabase = getSupabaseServiceClient();
  if (!id || !getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("content_items")
    .select("id,kind,status,slug,title,excerpt,body,category,author_name,read_time,source_url,video_url,video_id,video_title,cover_image_url,featured,metadata,scheduled_at,published_at,updated_at")
    .eq("id", id)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  return data ? toEditorItem(data as ContentRow) : null;
}

export async function saveContentItem(input: ContentMutation, context: AdminContext) {
  assertRole(context, writerRoles);

  if (input.status === "published") {
    assertRole(context, publishableRoles);
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = input.id
    ? await supabase.from("content_items").select("status").eq("id", input.id).maybeSingle()
    : { data: null };

  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const row = {
    id: input.id || undefined,
    kind: input.kind,
    status: input.status,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    author_name: input.authorName,
    read_time: input.readTime,
    source_url: input.sourceUrl ?? "",
    video_url: input.videoUrl ?? "",
    video_id: input.videoId ?? "",
    video_title: input.videoTitle ?? "",
    cover_image_url: input.coverImageUrl ?? "",
    featured: input.featured ?? false,
    metadata: input.metadata,
    scheduled_at: input.status === "scheduled" ? input.scheduledAt ?? null : null,
    published_at: publishedAt,
    created_by: input.id ? undefined : context.user?.id,
    updated_by: context.user?.id,
  };

  const { data, error } = await supabase.from("content_items").upsert(row, { onConflict: "id" }).select("id,status,title,kind,slug").single();
  if (error) throw error;

  const revisionRows = await supabase.from("content_revisions").select("revision_number").eq("content_id", data.id).order("revision_number", { ascending: false }).limit(1);
  const revisionNumber = ((revisionRows.data ?? [])[0]?.revision_number ?? 0) + 1;

  await supabase.from("content_revisions").insert({
    content_id: data.id,
    revision_number: revisionNumber,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    metadata: input.metadata,
    status: input.status,
    created_by: context.user?.id,
  });

  const fromStatus = (previous.data?.status as ContentStatus | undefined) ?? null;
  if (fromStatus !== input.status) {
    await supabase.from("workflow_events").insert({
      content_id: data.id,
      from_status: fromStatus,
      to_status: input.status,
      note: input.id ? "Status updated from admin editor." : "Content created from admin editor.",
      actor_id: context.user?.id,
    });
  }

  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: input.id ? "content.update" : "content.create",
    entity_table: "content_items",
    entity_id: data.id,
    summary: `${data.kind} ${data.slug} saved as ${data.status}.`,
    metadata: { title: data.title },
  });

  revalidateTag("published-content", "max");
  revalidatePath("/blog");
  revalidatePath("/guides");
  if (input.kind === "blog_post") revalidatePath(`/blog/${input.slug}`);
  if (input.kind === "guide") revalidatePath(`/guides/${input.slug}`);

  return data.id as string;
}

export async function transitionContentItem(id: string, status: ContentStatus, note: string, context: AdminContext) {
  assertRole(context, status === "published" ? publishableRoles : ["owner", "editor", "reviewer", "contributor"]);

  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = await supabase.from("content_items").select("status,slug,kind,title").eq("id", id).single();
  if (previous.error) throw previous.error;

  const { data, error } = await supabase
    .from("content_items")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_by: context.user?.id,
    })
    .eq("id", id)
    .select("id,kind,slug,title")
    .single();
  if (error) throw error;

  await supabase.from("workflow_events").insert({
    content_id: id,
    from_status: previous.data.status,
    to_status: status,
    note,
    actor_id: context.user?.id,
  });

  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "content.transition",
    entity_table: "content_items",
    entity_id: id,
    summary: `${data.kind} ${data.slug} moved to ${status}.`,
    metadata: { title: data.title, note },
  });

  revalidateTag("published-content", "max");
  revalidatePath("/blog");
  revalidatePath("/guides");
  if (data.kind === "blog_post") revalidatePath(`/blog/${data.slug}`);
  if (data.kind === "guide") revalidatePath(`/guides/${data.slug}`);
}
