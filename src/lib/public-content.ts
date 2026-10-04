import "server-only";

import { unstable_cache } from "next/cache";
import type { Guide } from "@/lib/guides";
import { getSupabasePublicClient, selectAllRows } from "@/lib/supabase/server";
import type { ContentKind, ContentStatus } from "@/lib/admin/types";

type PublicBlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  read: string;
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  content: string;
};

type PublicAlumniStory = {
  name: string;
  achievement: string;
  subject: string;
  location: string;
  quote: string;
  role: string;
};

type PublishedContentRow = {
  kind: ContentKind;
  status: ContentStatus;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  author_name: string;
  read_time: string;
  source_url: string;
  video_url: string;
  video_id: string;
  video_title: string;
  featured: boolean;
  metadata: Record<string, unknown>;
  published_at: string | null;
  updated_at: string;
};

function displayDate(value: string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function rowToBlogPost(row: PublishedContentRow): PublicBlogPost {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    date: displayDate(row.published_at ?? row.updated_at),
    author: row.author_name,
    read: row.read_time,
    videoUrl: row.video_url,
    videoId: row.video_id,
    videoTitle: row.video_title,
    content: row.body,
  };
}

function rowToGuide(row: PublishedContentRow): Guide {
  const tags = Array.isArray(row.metadata?.tags) ? row.metadata.tags.map(String) : [];
  return {
    slug: row.slug,
    title: row.title,
    description: row.excerpt,
    category: row.category,
    level: String(row.metadata?.level || "Beginner"),
    readTime: row.read_time,
    author: row.author_name,
    updated: String(row.metadata?.updated || displayDate(row.published_at ?? row.updated_at)),
    sourceUrl: row.source_url,
    tags,
    featured: row.featured,
    content: row.body,
  };
}

// Scheduled items carry their go-live time in published_at, so they appear once it passes.
const liveStatuses: ContentStatus[] = ["published", "scheduled"];

async function queryPublishedRows(kind: ContentKind) {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data, error } = await selectAllRows<PublishedContentRow>((from, to) =>
    supabase
      .from("content_items")
      .select("kind,status,slug,title,excerpt,body,category,author_name,read_time,source_url,video_url,video_id,video_title,featured,metadata,published_at,updated_at")
      .eq("kind", kind)
      .in("status", liveStatuses)
      .is("deleted_at", null)
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .order("slug", { ascending: true })
      .range(from, to),
  );

  if (error) {
    console.error("Published content query failed", error);
    return [];
  }

  return data ?? [];
}

const getCachedPublishedRows = unstable_cache(queryPublishedRows, ["published-content"], {
  tags: ["published-content"],
  revalidate: 300,
});

export async function getPublishedBlogPosts() {
  const rows = await getCachedPublishedRows("blog_post");
  return rows.map(rowToBlogPost);
}

function rowToAlumniStory(row: PublishedContentRow): PublicAlumniStory {
  return {
    name: row.title,
    achievement: String(row.metadata?.achievement || row.category || "Olympiad Alumni"),
    subject: String(row.metadata?.subject || row.category || "Olympiads"),
    location: String(row.metadata?.location || ""),
    quote: row.excerpt || row.body,
    role: String(row.metadata?.role || row.author_name),
  };
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const posts = await getPublishedBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getPublishedBlogSlugs() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => post.slug);
}

export async function getPublishedGuides() {
  const rows = await getCachedPublishedRows("guide");
  return rows.map(rowToGuide).sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

export async function getPublishedGuideBySlug(slug: string) {
  const rows = await getCachedPublishedRows("guide");
  const row = rows.find((item) => item.slug === slug);
  return row ? rowToGuide(row) : null;
}

export async function getPublishedGuideSlugs() {
  const rows = await getCachedPublishedRows("guide");
  return rows.map((row) => row.slug);
}

export async function getPublishedAlumniStories() {
  const rows = await getCachedPublishedRows("alumni_story");
  return rows.map(rowToAlumniStory);
}
