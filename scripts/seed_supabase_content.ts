import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "../src/lib/data";
import { getAllGuides } from "../src/lib/guides";

type JsonRecord = Record<string, unknown>;
type SupabaseResult<T = unknown> = {
  data: T | null;
  error: unknown;
};
type QueryBuilder<T = unknown> = PromiseLike<SupabaseResult<T>> & {
  select: (columns?: string, options?: unknown) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  order: (column: string, options?: unknown) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  single: () => PromiseLike<SupabaseResult<T>>;
};
type SupabaseTable = {
  upsert: (values: unknown, options?: unknown) => QueryBuilder;
  insert: (values: unknown, options?: unknown) => QueryBuilder;
  select: (columns?: string, options?: unknown) => QueryBuilder;
};
type SupabaseSeeder = {
  from: (table: string) => SupabaseTable;
};

const root = path.resolve(__dirname, "..");

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Load .env.local or export the variable before running db:seed.`);
  }
  return value;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function readMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min`;
}

function parseDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function assertOk<T>(label: string, result: SupabaseResult<unknown>) {
  if (result.error) {
    throw new Error(`${label} failed: ${JSON.stringify(result.error)}`);
  }
  return result.data as T;
}

async function upsertContent(
  supabase: SupabaseSeeder,
  item: {
    kind: "blog_post" | "guide";
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
    featured?: boolean;
    metadata?: JsonRecord;
    publishedAt?: string;
  },
) {
  const publishedAt = item.publishedAt ?? new Date().toISOString();
  const row = {
    kind: item.kind,
    status: "published",
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    body: item.body,
    category: item.category,
    author_name: item.authorName,
    read_time: item.readTime,
    source_url: item.sourceUrl ?? "",
    video_url: item.videoUrl ?? "",
    video_id: item.videoId ?? "",
    video_title: item.videoTitle ?? "",
    featured: item.featured ?? false,
    metadata: item.metadata ?? {},
    published_at: publishedAt,
  };

  const content = assertOk<{ id: string }>(
    `content ${item.kind}/${item.slug}`,
    await supabase.from("content_items").upsert(row, { onConflict: "kind,slug" }).select("id").single(),
  );

  const revisionRows = assertOk<{ revision_number: number }[]>(
    `revision lookup ${item.slug}`,
    await supabase.from("content_revisions").select("revision_number").eq("content_id", content.id).order("revision_number", { ascending: false }).limit(1),
  );
  const revisionNumber = (revisionRows[0]?.revision_number ?? 0) + 1;

  assertOk(
    `revision ${item.slug}`,
    await supabase.from("content_revisions").insert({
      content_id: content.id,
      revision_number: revisionNumber,
      title: item.title,
      excerpt: item.excerpt,
      body: item.body,
      metadata: item.metadata ?? {},
      status: "published",
    }),
  );

  const tags = Array.isArray(item.metadata?.tags) ? (item.metadata.tags as string[]) : [];
  for (const tag of tags) {
    const tagRow = assertOk<{ id: string }>(
      `tag ${tag}`,
      await supabase.from("tags").upsert({ slug: slugify(tag), label: tag }, { onConflict: "slug" }).select("id").single(),
    );
    assertOk(`content tag ${item.slug}/${tag}`, await supabase.from("content_tags").upsert({ content_id: content.id, tag_id: tagRow.id }));
  }
}

async function main() {
  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  }) as unknown as SupabaseSeeder;

  for (const post of blogPosts) {
    await upsertContent(supabase, {
      kind: "blog_post",
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.content,
      category: post.category,
      authorName: post.author,
      readTime: post.read,
      videoUrl: post.videoUrl,
      videoId: post.videoId,
      videoTitle: post.videoTitle,
      metadata: {
        legacyDate: post.date,
        tags: [post.category],
      },
      publishedAt: parseDate(post.date),
    });
  }

  for (const guide of getAllGuides()) {
    await upsertContent(supabase, {
      kind: "guide",
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.description,
      body: guide.content,
      category: guide.category,
      authorName: guide.author,
      readTime: guide.readTime || readMinutes(guide.content),
      sourceUrl: guide.sourceUrl,
      featured: guide.featured,
      metadata: {
        level: guide.level,
        tags: guide.tags,
        updated: guide.updated,
      },
      publishedAt: parseDate(guide.updated),
    });
  }

  const resources = readJson<JsonRecord[]>("src/data/resources.json");
  for (const resource of resources) {
    assertOk(
      `resource ${resource.id}`,
      await supabase.from("resources").upsert(
        {
          id: resource.id,
          status: "published",
          title: resource.title,
          description: resource.description ?? "",
          subject: resource.subject,
          kind: resource.kind,
          folder: resource.folder,
          year: resource.year,
          pages: resource.pages ?? 0,
          size_bytes: resource.sizeBytes ?? 0,
          local_url: resource.localUrl,
          source_url: resource.sourceUrl ?? "",
        },
        { onConflict: "id" },
      ),
    );
  }

  const pastPapers = readJson<JsonRecord[]>("src/data/past-papers.json");
  for (const paper of pastPapers) {
    assertOk(
      `paper ${paper.id}`,
      await supabase.from("past_papers").upsert(
        {
          id: paper.id,
          status: "published",
          title: paper.title,
          exam: paper.exam,
          subject: paper.subject,
          year: paper.year,
          pages: paper.pages ?? 0,
          resource_url: paper.resourceUrl,
          source_url: paper.sourceUrl ?? "",
          scanned: paper.scanned ?? false,
          page_images: paper.pageImages ?? [],
          question_count: paper.questionCount ?? 0,
          mcq_count: paper.mcqCount ?? 0,
          descriptive_count: paper.descriptiveCount ?? 0,
          part_i_count: paper.partICount ?? 0,
          part_ii_count: paper.partIICount ?? 0,
        },
        { onConflict: "id" },
      ),
    );
  }

  const questions = readJson<JsonRecord[]>("src/data/questions.json");
  for (const question of questions) {
    assertOk(
      `question ${question.id}`,
      await supabase.from("questions").upsert(
        {
          id: question.id,
          status: "published",
          paper_id: question.paperId || null,
          paper_subject: question.paperSubject ?? "",
          number: question.number,
          display_number: question.displayNumber ?? "",
          subject: question.subject,
          topic: question.topic ?? "",
          difficulty: question.difficulty ?? "",
          type: question.type,
          section: question.section ?? "",
          section_title: question.sectionTitle ?? "",
          exam: question.exam ?? "",
          year: question.year,
          source: question.source ?? "",
          prompt: question.prompt,
          options: question.options ?? [],
          answer: question.answer,
          solution: question.solution ?? "",
          page: question.page,
          figure: question.figure ?? "",
        },
        { onConflict: "id" },
      ),
    );
  }

  console.log(`Seeded ${blogPosts.length} blog posts, ${getAllGuides().length} guides, ${resources.length} resources, ${pastPapers.length} papers, and ${questions.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
