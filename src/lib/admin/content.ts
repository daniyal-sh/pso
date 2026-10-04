import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import type {
  AdminContext,
  AdminDashboardData,
  AdminSubject,
  ContentEditorItem,
  ContentKind,
  ContentListItem,
  ContentStatus,
  ModeratorAdminItem,
  ResourceAdminItem,
} from "@/lib/admin/types";
import { canDelete, canManageContentKind, canManageResourceSubject, isOwner, permissionsFromRows } from "@/lib/admin/auth";
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
  created_by: string | null;
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

type ResourceMutation = Omit<ResourceAdminItem, "id" | "updatedAt" | "sizeBytes" | "createdBy"> & {
  id?: string;
  sizeBytes: number;
};

const maxResourceUploadBytes = 50 * 1024 * 1024;
const allowedResourceMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const resourceExtensionMimeTypes: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

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
    createdBy: row.created_by ?? null,
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

function assertAdmin(context: AdminContext) {
  if (!context.user || !context.member || context.member.status !== "active") throw new Error("You are not allowed to perform this admin action.");
}

function assertOwner(context: AdminContext) {
  assertAdmin(context);
  if (!isOwner(context)) throw new Error("Only the owner can perform this action.");
}

function assertManageContent(context: AdminContext, kind: ContentKind, item?: { createdBy?: string | null } | null) {
  assertAdmin(context);
  if (!canManageContentKind(context, kind, item)) throw new Error("You are not allowed to manage this content item.");
}

function assertManageResource(context: AdminContext, subject: string) {
  assertAdmin(context);
  if (!canManageResourceSubject(context, subject)) throw new Error("You are not allowed to manage resources for this subject.");
}

function slugSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function safeFilename(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "resource-file";
}

function isUploadFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function resourceUploadContentType(file: File) {
  if (allowedResourceMimeTypes.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return resourceExtensionMimeTypes[extension] ?? null;
}

function friendlyDatabaseError(error: { message?: string; code?: string }) {
  if (error.code === "23505" && /content_items_kind_slug/.test(error.message ?? "")) return "Another item of this type already uses that slug.";
  return error.message || "The database rejected this change.";
}

function isAllowedResourceUrl(value: string, subject: string, resourceId: string, previousUrl?: string | null) {
  if (value === previousUrl) return true;
  if (/^https?:\/\//i.test(value)) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  const ownPrefix = `/resources/${slugSegment(subject)}/${resourceId}/`;
  return value.startsWith(ownPrefix) && !value.includes("..");
}

export async function getAdminDashboardData(context?: AdminContext): Promise<AdminDashboardData> {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) {
    return {
      source: "unavailable",
      metrics: {
        totalContent: 0,
        publishedContent: 0,
        reviewQueue: 0,
        scheduledContent: 0,
        resources: 0,
        pastPapers: 0,
        questions: 0,
        admins: 0,
      },
      content: [],
    };
  }

  let contentQuery = supabase
    .from("content_items")
    .select("id,kind,status,slug,title,excerpt,category,author_name,read_time,featured,created_by,scheduled_at,published_at,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (context && !isOwner(context)) {
    const allowedKinds = [
      ...(context.permissions.blogs ? ["blog_post"] : []),
      ...(context.permissions.guides ? ["guide"] : []),
    ];
    contentQuery = allowedKinds.length > 0 ? contentQuery.eq("created_by", context.user?.id ?? "").in("kind", allowedKinds) : contentQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const scopedCount = (status?: ContentStatus[]) => {
    let query = supabase.from("content_items").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (status) query = query.in("status", status);
    if (context && !isOwner(context)) {
      const allowedKinds = [...(context.permissions.blogs ? ["blog_post"] : []), ...(context.permissions.guides ? ["guide"] : [])];
      query = allowedKinds.length > 0 ? query.eq("created_by", context.user?.id ?? "").in("kind", allowedKinds) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
    return query;
  };

  const [contentResult, totalResult, publishedResult, reviewResult, scheduledResult, resourcesResult, papersResult, questionsResult, adminsResult] = await Promise.all([
    contentQuery,
    scopedCount(),
    scopedCount(["published"]),
    scopedCount(["in_review", "changes_requested"]),
    scopedCount(["scheduled"]),
    supabase.from("resources").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("past_papers").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("admin_members").select("id", { count: "exact", head: true }),
  ]);

  const content = ((contentResult.data ?? []) as ContentRow[]).map(toListItem);
  return {
    source: "supabase",
    metrics: {
      totalContent: totalResult.count ?? 0,
      publishedContent: publishedResult.count ?? 0,
      reviewQueue: reviewResult.count ?? 0,
      scheduledContent: scheduledResult.count ?? 0,
      resources: resourcesResult.count ?? 0,
      pastPapers: papersResult.count ?? 0,
      questions: questionsResult.count ?? 0,
      admins: adminsResult.count ?? 0,
    },
    content,
  };
}

export async function getAdminContentList(kind?: ContentKind, context?: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) {
    return [];
  }

  let query = supabase
    .from("content_items")
    .select("id,kind,status,slug,title,excerpt,category,author_name,read_time,featured,created_by,scheduled_at,published_at,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  if (context && !isOwner(context)) {
    if (kind === "blog_post" || kind === "guide") {
      query = query.eq("created_by", context.user?.id ?? "");
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as ContentRow[]).map(toListItem);
}

export async function getAdminContentItem(id?: string, kind: ContentKind = "blog_post", context?: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!id || !getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("content_items")
    .select("id,kind,status,slug,title,excerpt,body,category,author_name,read_time,source_url,video_url,video_id,video_title,cover_image_url,featured,created_by,metadata,scheduled_at,published_at,updated_at")
    .eq("id", id)
    .eq("kind", kind)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  const item = data ? toEditorItem(data as ContentRow) : null;
  if (item && context) assertManageContent(context, kind, item);
  return item;
}

function revalidateContent(kind: string, slugs: (string | null | undefined)[]) {
  revalidateTag("published-content", "max");
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/guides");
  revalidatePath("/alumni");
  for (const slug of new Set(slugs.filter(Boolean))) {
    if (kind === "blog_post") revalidatePath(`/blog/${slug}`);
    if (kind === "guide") revalidatePath(`/guides/${slug}`);
  }
}

export async function saveContentItem(input: ContentMutation, context: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = input.id
    ? await supabase.from("content_items").select("kind,created_by").eq("id", input.id).is("deleted_at", null).maybeSingle()
    : { data: null };
  if (input.id && !previous.data) throw new Error("Content item was not found.");
  if (previous.data && previous.data.kind !== input.kind) throw new Error("Content type cannot be changed after creation.");

  assertManageContent(context, input.kind, previous.data ? { createdBy: previous.data.created_by } : null);
  if (input.status === "scheduled" && !isOwner(context)) throw new Error("Only owners can schedule content.");

  const { data, error } = await supabase.rpc("admin_save_content", {
    p_actor: context.user?.id ?? null,
    p_item: {
      id: input.id ?? null,
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
      scheduled_at: input.status === "scheduled" ? (input.scheduledAt ?? null) : null,
    },
  });
  if (error) throw new Error(friendlyDatabaseError(error));

  const saved = data as { id: string; kind: string; slug: string; previous_slug: string | null };
  revalidateContent(saved.kind, [saved.slug, saved.previous_slug]);
  return saved.id;
}

export async function transitionContentItem(id: string, status: ContentStatus, note: string, context: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = await supabase.from("content_items").select("kind,created_by").eq("id", id).is("deleted_at", null).maybeSingle();
  if (previous.error) throw new Error(friendlyDatabaseError(previous.error));
  if (!previous.data) throw new Error("Content item was not found.");
  assertManageContent(context, previous.data.kind as ContentKind, { createdBy: previous.data.created_by });
  if (status === "scheduled" && !isOwner(context)) throw new Error("Only owners can schedule content.");

  const { data, error } = await supabase.rpc("admin_transition_content", {
    p_id: id,
    p_status: status,
    p_note: note,
    p_actor: context.user?.id ?? null,
  });
  if (error) throw new Error(friendlyDatabaseError(error));

  const saved = data as { kind: string; slug: string };
  revalidateContent(saved.kind, [saved.slug]);
}

export async function getAdminResources(context?: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return [];
  let query = supabase
    .from("resources")
    .select("id,status,title,description,subject,kind,folder,year,pages,size_bytes,local_url,source_url,created_by,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (context && !isOwner(context)) {
    if (context.permissions.resourceSubjects.length === 0) query = query.eq("subject", "__no_access__");
    else query = query.in("subject", context.permissions.resourceSubjects);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    title: row.title,
    description: row.description,
    subject: row.subject as AdminSubject,
    kind: row.kind,
    folder: row.folder,
    year: row.year,
    pages: row.pages,
    sizeBytes: row.size_bytes,
    localUrl: row.local_url ?? "",
    sourceUrl: row.source_url,
    createdBy: row.created_by ?? null,
    updatedAt: row.updated_at,
  })) satisfies ResourceAdminItem[];
}

export async function getAdminResourceItem(id?: string, context?: AdminContext) {
  if (!id) return null;
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("resources")
    .select("id,status,title,description,subject,kind,folder,year,pages,size_bytes,local_url,source_url,created_by,updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (context) assertManageResource(context, data.subject);
  return {
    id: data.id,
    status: data.status,
    title: data.title,
    description: data.description,
    subject: data.subject as AdminSubject,
    kind: data.kind,
    folder: data.folder,
    year: data.year,
    pages: data.pages,
    sizeBytes: data.size_bytes,
    localUrl: data.local_url ?? "",
    sourceUrl: data.source_url,
    createdBy: data.created_by ?? null,
    updatedAt: data.updated_at,
  } satisfies ResourceAdminItem;
}

export async function uploadResourceFileToStorage(subject: string, resourceId: string, fileValue: FormDataEntryValue | null | undefined) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  if (!isUploadFile(fileValue)) throw new Error("Choose a PDF, PNG, JPEG, or WEBP file to upload.");
  const contentType = resourceUploadContentType(fileValue);
  if (!contentType) throw new Error("Upload must be a PDF, PNG, JPEG, or WEBP file.");
  if (fileValue.size > maxResourceUploadBytes) throw new Error("Upload must be 50 MB or smaller.");

  const objectPath = `${slugSegment(subject)}/${resourceId}/${Date.now()}-${safeFilename(fileValue.name)}`;
  const upload = await supabase.storage.from("resource-files").upload(objectPath, fileValue, {
    contentType,
    upsert: false,
  });
  if (upload.error) throw upload.error;
  return {
    localUrl: `/resources/${objectPath}`,
    sizeBytes: fileValue.size,
  };
}

/**
 * Creates a one-time signed upload URL so the browser can send the file straight to
 * Supabase Storage. This avoids the serverless request body limit (4.5 MB on Vercel).
 */
export async function createResourceUploadUrl(subject: string, resourceId: string, file: { name: string; type: string; size: number }) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const contentType = allowedResourceMimeTypes.has(file.type) ? file.type : (resourceExtensionMimeTypes[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null);
  if (!contentType) throw new Error("Upload must be a PDF, PNG, JPEG, or WEBP file.");
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error("Choose a file to upload.");
  if (file.size > maxResourceUploadBytes) throw new Error("Upload must be 50 MB or smaller.");

  const objectPath = `${slugSegment(subject)}/${resourceId}/${Date.now()}-${safeFilename(file.name)}`;
  const { data, error } = await supabase.storage.from("resource-files").createSignedUploadUrl(objectPath);
  if (error) throw error;
  return {
    signedUrl: data.signedUrl,
    contentType,
    localUrl: `/resources/${objectPath}`,
    sizeBytes: file.size,
  };
}

export async function saveResourceItem(input: ResourceMutation, context: AdminContext, fileValue?: FormDataEntryValue | null) {
  assertManageResource(context, input.subject);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const resourceId = input.id?.trim() || `${slugSegment(input.subject)}-${slugSegment(input.title)}`;
  if (!resourceId) throw new Error("Resource needs a title before it can be saved.");
  const previous = await supabase.from("resources").select("subject,local_url,deleted_at").eq("id", resourceId).maybeSingle();
  if (previous.data) assertManageResource(context, previous.data.subject);

  let localUrl = input.localUrl || previous.data?.local_url || null;
  let sizeBytes = input.sizeBytes;
  if (isUploadFile(fileValue)) {
    const upload = await uploadResourceFileToStorage(input.subject, resourceId, fileValue);
    localUrl = upload.localUrl;
    sizeBytes = upload.sizeBytes;
  }
  if (localUrl && !isAllowedResourceUrl(localUrl, input.subject, resourceId, previous.data?.local_url)) {
    throw new Error("Resource link must be an http(s) URL or a file uploaded for this resource.");
  }

  const { data, error } = await supabase.rpc("admin_save_resource", {
    p_actor: context.user?.id ?? null,
    p_item: {
      id: resourceId,
      status: input.status,
      title: input.title,
      description: input.description,
      subject: input.subject,
      kind: input.kind,
      folder: input.folder,
      year: input.year,
      pages: input.pages,
      size_bytes: sizeBytes,
      local_url: localUrl,
    },
  });
  if (error) throw new Error(friendlyDatabaseError(error));

  const saved = data as { id: string; updated_at: string };
  revalidateTag("published-resources", "max");
  revalidatePath("/resources");
  return { id: saved.id, updatedAt: saved.updated_at };
}

export async function getAdminModerators() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return [] satisfies ModeratorAdminItem[];
  const { data, error } = await supabase
    .from("admin_members")
    .select("id,email,user_id,display_name,status,is_owner,last_login_at,created_at,updated_at,moderator_permissions(permission,subject)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name || row.email,
      status: row.status,
      isOwner: row.is_owner,
      lastLoginAt: row.last_login_at,
      permissions: permissionsFromRows(row.moderator_permissions as { permission: "resources_subject" | "blog" | "guide"; subject: string | null }[]),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }) satisfies ModeratorAdminItem[];
}

export async function saveModeratorAccess(
  input: { memberId?: string; email: string; displayName: string; status: "active" | "disabled"; isOwner: boolean; canBlog: boolean; canGuide: boolean; resourceSubjects: AdminSubject[] },
  context: AdminContext,
) {
  assertOwner(context);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  if (input.memberId && context.member?.id === input.memberId && (!input.isOwner || input.status === "disabled" || input.email !== context.member.email.toLowerCase())) {
    throw new Error("You cannot remove, disable, or change the email of your own owner access.");
  }

  const permissions = [
    ...(input.canBlog ? [{ permission: "blog" }] : []),
    ...(input.canGuide ? [{ permission: "guide" }] : []),
    ...input.resourceSubjects.map((subject) => ({ permission: "resources_subject", subject })),
  ];

  const { data, error } = await supabase.rpc("admin_save_member_access", {
    p_member_id: input.memberId ?? null,
    p_email: input.email,
    p_display_name: input.displayName,
    p_status: input.status,
    p_is_owner: input.isOwner,
    p_permissions: permissions,
    p_actor: context.user?.id ?? null,
  });
  if (error) throw new Error(friendlyDatabaseError(error));

  revalidatePath("/admin/contributors");
  return (data as { id: string }).id;
}

export async function deleteContentItem(id: string, context: AdminContext) {
  if (!canDelete(context)) throw new Error("Only the owner can delete content.");
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.rpc("admin_delete_content", { p_id: id, p_actor: context.user?.id ?? null });
  if (error) throw new Error(friendlyDatabaseError(error));
  const deleted = data as { kind: string; slug: string };
  revalidateContent(deleted.kind, [deleted.slug]);
}

export async function deleteResourceItem(id: string, context: AdminContext) {
  if (!canDelete(context)) throw new Error("Only the owner can delete resources.");
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.rpc("admin_delete_resource", { p_id: id, p_actor: context.user?.id ?? null });
  if (error) throw new Error(friendlyDatabaseError(error));

  const localUrl = (data as { local_url: string | null }).local_url;
  const objectPath = localUrl?.startsWith("/resources/") ? localUrl.slice("/resources/".length) : null;
  // Only remove the file when no other resource still points at it.
  if (objectPath) {
    const { count } = await supabase.from("resources").select("id", { count: "exact", head: true }).eq("local_url", localUrl);
    if (!count) {
      const removed = await supabase.storage.from("resource-files").remove([objectPath]);
      if (removed.error) console.error("Failed to remove resource file", removed.error);
    }
  }
  revalidateTag("published-resources", "max");
  revalidatePath("/resources");
}
