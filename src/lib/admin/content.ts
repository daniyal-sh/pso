import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { blogPosts } from "@/lib/data";
import { getAllGuides } from "@/lib/guides";
import { pastPapers, questions } from "@/lib/content-data";
import type {
  AdminContext,
  AdminDashboardData,
  AdminSubject,
  ContentEditorItem,
  ContentKind,
  ContentListItem,
  ContentStatus,
  ModeratorAdminItem,
  PastPaperAdminItem,
  QuestionAdminItem,
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

type DatasetStatusRow = {
  status: ContentStatus;
  updated_at: string;
};

type ResourceMutation = Omit<ResourceAdminItem, "updatedAt" | "sizeBytes" | "createdBy"> & {
  sizeBytes: number;
};

type PastPaperMutation = Omit<PastPaperAdminItem, "updatedAt">;

type QuestionMutation = Omit<QuestionAdminItem, "updatedAt">;

const maxResourceUploadBytes = 50 * 1024 * 1024;
const allowedResourceMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

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
      createdBy: null,
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
      createdBy: null,
      updatedAt: guide.updated,
    publishedAt: guide.updated,
    scheduledAt: null,
  }));
  return [...blog, ...guides];
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

function datasetTimestamp(row?: Partial<DatasetStatusRow>) {
  return row?.updated_at ?? new Date().toISOString();
}

function slugSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "");
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

function fallbackPastPapers(): PastPaperAdminItem[] {
  return pastPapers.map((paper) => ({
    id: paper.id,
    status: "published",
    title: paper.title,
    exam: paper.exam,
    subject: paper.subject,
    year: paper.year,
    pages: paper.pages,
    resourceUrl: paper.resourceUrl ?? "",
    sourceUrl: paper.sourceUrl,
    scanned: paper.scanned,
    pageImages: paper.pageImages,
    questionCount: paper.questionCount,
    mcqCount: paper.mcqCount,
    descriptiveCount: paper.descriptiveCount,
    partICount: paper.partICount,
    partIICount: paper.partIICount,
    updatedAt: "",
  }));
}

function fallbackQuestions(): QuestionAdminItem[] {
  return questions.map((question) => ({
    id: question.id,
    status: "published",
    paperId: question.paperId,
    paperSubject: question.paperSubject,
    number: question.number,
    displayNumber: question.displayNumber,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    type: question.type,
    section: question.section,
    sectionTitle: question.sectionTitle,
    exam: question.exam,
    year: question.year,
    source: question.source,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    solution: question.solution,
    page: question.page,
    figure: question.figure,
    updatedAt: "",
  }));
}

export async function getAdminDashboardData(context?: AdminContext): Promise<AdminDashboardData> {
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
        resources: 0,
        pastPapers: pastPapers.length,
        questions: questions.length,
        admins: 0,
      },
      content: content.slice(0, 8),
      workflowEvents: [],
      auditLog: [],
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
    contentQuery = allowedKinds.length > 0 ? contentQuery.eq("created_by", context.user?.id ?? "").in("kind", allowedKinds) : contentQuery.eq("id", "__no_access__");
  }

  const [contentResult, resourcesResult, papersResult, questionsResult, adminsResult, workflowResult, auditResult] = await Promise.all([
    contentQuery,
    supabase.from("resources").select("id", { count: "exact", head: true }),
    supabase.from("past_papers").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("admin_members").select("id", { count: "exact", head: true }),
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

export async function getAdminContentList(kind?: ContentKind, context?: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) {
    return fallbackContent().filter((item) => !kind || item.kind === kind);
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
      query = query.eq("created_by", "__no_access__");
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

export async function saveContentItem(input: ContentMutation, context: AdminContext) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = input.id
    ? await supabase.from("content_items").select("status,kind,created_by").eq("id", input.id).is("deleted_at", null).maybeSingle()
    : { data: null };
  if (input.id && !previous.data) throw new Error("Content item was not found.");

  assertManageContent(context, input.kind, previous.data ? { createdBy: previous.data.created_by } : null);

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
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const previous = await supabase.from("content_items").select("status,slug,kind,title,created_by").eq("id", id).is("deleted_at", null).single();
  if (previous.error) throw previous.error;
  assertManageContent(context, previous.data.kind as ContentKind, { createdBy: previous.data.created_by });

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

export async function saveResourceItem(input: ResourceMutation, context: AdminContext, fileValue?: FormDataEntryValue | null) {
  assertManageResource(context, input.subject);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const previous = await supabase.from("resources").select("subject,local_url").eq("id", input.id).is("deleted_at", null).maybeSingle();
  if (previous.data) assertManageResource(context, previous.data.subject);

  let localUrl = input.localUrl || previous.data?.local_url || null;
  let sizeBytes = input.sizeBytes;
  if (isUploadFile(fileValue)) {
    if (!allowedResourceMimeTypes.has(fileValue.type)) throw new Error("Upload must be a PDF, PNG, JPEG, or WEBP file.");
    if (fileValue.size > maxResourceUploadBytes) throw new Error("Upload must be 50 MB or smaller.");
    const objectPath = `${slugSegment(input.subject)}/${slugSegment(input.id)}/${Date.now()}-${safeFilename(fileValue.name)}`;
    const upload = await supabase.storage.from("resource-files").upload(objectPath, fileValue, {
      contentType: fileValue.type,
      upsert: false,
    });
    if (upload.error) throw upload.error;
    localUrl = `/resources/${objectPath}`;
    sizeBytes = fileValue.size;
  }

  const { data, error } = await supabase
    .from("resources")
    .upsert(
      {
        id: input.id,
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
        source_url: "",
        created_by: previous.data ? undefined : context.user?.id,
        updated_by: context.user?.id,
      },
      { onConflict: "id" },
    )
    .select("id,status,updated_at")
    .single();
  if (error) throw error;
  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "resource.upsert",
    entity_table: "resources",
    entity_id: input.id,
    summary: `${input.title} saved as ${data.status}.`,
  });
  revalidateTag("published-resources", "max");
  revalidatePath("/resources");
  return { id: data.id as string, updatedAt: datasetTimestamp(data) };
}

export async function getAdminPastPapers() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return fallbackPastPapers();
  const { data, error } = await supabase
    .from("past_papers")
    .select("id,status,title,exam,subject,year,pages,resource_url,source_url,scanned,page_images,question_count,mcq_count,descriptive_count,part_i_count,part_ii_count,updated_at")
    .order("year", { ascending: false })
    .order("subject", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    title: row.title,
    exam: row.exam,
    subject: row.subject,
    year: row.year,
    pages: row.pages,
    resourceUrl: row.resource_url ?? "",
    sourceUrl: row.source_url,
    scanned: row.scanned,
    pageImages: row.page_images ?? [],
    questionCount: row.question_count,
    mcqCount: row.mcq_count,
    descriptiveCount: row.descriptive_count,
    partICount: row.part_i_count,
    partIICount: row.part_ii_count,
    updatedAt: row.updated_at,
  })) satisfies PastPaperAdminItem[];
}

export async function getAdminPastPaperItem(id?: string) {
  if (!id) return null;
  const rows = await getAdminPastPapers();
  return rows.find((row) => row.id === id) ?? null;
}

export async function savePastPaperItem(input: PastPaperMutation, context: AdminContext) {
  assertOwner(context);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase
    .from("past_papers")
    .upsert(
      {
        id: input.id,
        status: input.status,
        title: input.title,
        exam: input.exam,
        subject: input.subject,
        year: input.year,
        pages: input.pages,
        resource_url: input.resourceUrl || null,
        source_url: input.sourceUrl,
        scanned: input.scanned,
        page_images: input.pageImages,
        question_count: input.questionCount,
        mcq_count: input.mcqCount,
        descriptive_count: input.descriptiveCount,
        part_i_count: input.partICount,
        part_ii_count: input.partIICount,
      },
      { onConflict: "id" },
    )
    .select("id,status,updated_at")
    .single();
  if (error) throw error;
  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "past_paper.upsert",
    entity_table: "past_papers",
    entity_id: input.id,
    summary: `${input.title} saved as ${data.status}.`,
  });
  revalidateTag("published-past-papers", "max");
  revalidatePath("/past-papers");
  revalidatePath(`/past-papers/${input.id}`);
  return { id: data.id as string, updatedAt: datasetTimestamp(data) };
}

export async function getAdminQuestions() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return fallbackQuestions();
  const { data, error } = await supabase
    .from("questions")
    .select("id,status,paper_id,paper_subject,number,display_number,subject,topic,difficulty,type,section,section_title,exam,year,source,prompt,options,answer,solution,page,figure,updated_at")
    .order("year", { ascending: false })
    .order("paper_id", { ascending: true })
    .order("number", { ascending: true })
    .limit(1500);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    paperId: row.paper_id ?? "",
    paperSubject: row.paper_subject,
    number: row.number,
    displayNumber: row.display_number,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    type: row.type === "Long" ? "Long" : "MCQ",
    section: row.section,
    sectionTitle: row.section_title,
    exam: row.exam,
    year: row.year,
    source: row.source,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    answer: row.answer,
    solution: row.solution,
    page: row.page,
    figure: row.figure,
    updatedAt: row.updated_at,
  })) satisfies QuestionAdminItem[];
}

export async function getAdminQuestionItem(id?: string) {
  if (!id) return null;
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return fallbackQuestions().find((row) => row.id === id) ?? null;
  const { data, error } = await supabase
    .from("questions")
    .select("id,status,paper_id,paper_subject,number,display_number,subject,topic,difficulty,type,section,section_title,exam,year,source,prompt,options,answer,solution,page,figure,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    paperId: data.paper_id ?? "",
    paperSubject: data.paper_subject,
    number: data.number,
    displayNumber: data.display_number,
    subject: data.subject,
    topic: data.topic,
    difficulty: data.difficulty,
    type: data.type === "Long" ? "Long" : "MCQ",
    section: data.section,
    sectionTitle: data.section_title,
    exam: data.exam,
    year: data.year,
    source: data.source,
    prompt: data.prompt,
    options: Array.isArray(data.options) ? data.options.map(String) : [],
    answer: data.answer,
    solution: data.solution,
    page: data.page,
    figure: data.figure,
    updatedAt: data.updated_at,
  } satisfies QuestionAdminItem;
}

export async function saveQuestionItem(input: QuestionMutation, context: AdminContext) {
  assertOwner(context);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase
    .from("questions")
    .upsert(
      {
        id: input.id,
        status: input.status,
        paper_id: input.paperId || null,
        paper_subject: input.paperSubject,
        number: input.number,
        display_number: input.displayNumber,
        subject: input.subject,
        topic: input.topic,
        difficulty: input.difficulty,
        type: input.type,
        section: input.section,
        section_title: input.sectionTitle,
        exam: input.exam,
        year: input.year,
        source: input.source,
        prompt: input.prompt,
        options: input.options,
        answer: input.answer,
        solution: input.solution,
        page: input.page,
        figure: input.figure,
      },
      { onConflict: "id" },
    )
    .select("id,status,updated_at")
    .single();
  if (error) throw error;
  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "question.upsert",
    entity_table: "questions",
    entity_id: input.id,
    summary: `${input.source} ${input.displayNumber || input.number} saved as ${data.status}.`,
  });
  revalidateTag("published-questions", "max");
  revalidatePath("/question-bank");
  if (input.paperId) revalidatePath(`/past-papers/${input.paperId}`);
  return { id: data.id as string, updatedAt: datasetTimestamp(data) };
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

  if (input.memberId && context.member?.id === input.memberId && (!input.isOwner || input.status === "disabled")) {
    throw new Error("You cannot remove or disable your own owner access.");
  }

  const memberPayload = {
    email: input.email,
    display_name: input.displayName,
    status: input.status,
    is_owner: input.isOwner,
    invited_by: context.user?.id,
  };
  const mutation = input.memberId
    ? supabase.from("admin_members").update(memberPayload).eq("id", input.memberId)
    : supabase.from("admin_members").upsert(memberPayload, { onConflict: "email" });
  const { data, error } = await mutation.select("id,email,is_owner").single();
  if (error) throw error;

  if (!data.is_owner) {
    await supabase.from("moderator_permissions").delete().eq("member_id", data.id);
    const rows = [
      ...(input.canBlog ? [{ member_id: data.id, permission: "blog", subject: null }] : []),
      ...(input.canGuide ? [{ member_id: data.id, permission: "guide", subject: null }] : []),
      ...input.resourceSubjects.map((subject) => ({ member_id: data.id, permission: "resources_subject", subject })),
    ];
    if (rows.length > 0) {
      const insert = await supabase.from("moderator_permissions").insert(rows);
      if (insert.error) throw insert.error;
    }
  } else {
    await supabase.from("moderator_permissions").delete().eq("member_id", data.id);
  }

  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "admin_member.upsert",
    entity_table: "admin_members",
    entity_id: data.id,
    summary: `Admin access updated for ${data.email}.`,
  });
  revalidatePath("/admin/contributors");
  return data.id as string;
}

export async function deleteContentItem(id: string, context: AdminContext) {
  if (!canDelete(context)) throw new Error("Only the owner can delete content.");
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const previous = await supabase.from("content_items").select("id,kind,slug,title").eq("id", id).maybeSingle();
  if (previous.error) throw previous.error;
  if (!previous.data) throw new Error("Content item was not found.");
  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "content.delete",
    entity_table: "content_items",
    entity_id: id,
    summary: `${previous.data.kind} ${previous.data.slug} deleted.`,
    metadata: { title: previous.data.title },
  });
  const deleted = await supabase.from("content_items").delete().eq("id", id);
  if (deleted.error) throw deleted.error;
  revalidateTag("published-content", "max");
  revalidatePath("/blog");
  revalidatePath("/guides");
}

export async function deleteResourceItem(id: string, context: AdminContext) {
  if (!canDelete(context)) throw new Error("Only the owner can delete resources.");
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const previous = await supabase.from("resources").select("id,title,local_url").eq("id", id).maybeSingle();
  if (previous.error) throw previous.error;
  if (!previous.data) throw new Error("Resource was not found.");
  await supabase.from("audit_log").insert({
    actor_id: context.user?.id,
    action: "resource.delete",
    entity_table: "resources",
    entity_id: id,
    summary: `${previous.data.title} deleted.`,
  });
  if (previous.data.local_url?.startsWith("/resources/")) {
    await supabase.storage.from("resource-files").remove([previous.data.local_url.slice("/resources/".length)]);
  }
  const deleted = await supabase.from("resources").delete().eq("id", id);
  if (deleted.error) throw deleted.error;
  revalidateTag("published-resources", "max");
  revalidatePath("/resources");
}
