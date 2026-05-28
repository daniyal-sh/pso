import "server-only";

import { unstable_cache } from "next/cache";
import { alumniStories, blogPosts } from "@/lib/data";
import { getAllGuides, getGuideBySlug, getGuideSlugs, type Guide } from "@/lib/guides";
import { getSupabaseConfig, getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ContentKind, ContentStatus } from "@/lib/admin/types";

export type PublicBlogPost = {
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

export type PublicAlumniStory = {
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

async function queryPublishedRows(kind: ContentKind) {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return null;

  const { data, error } = await supabase
    .from("content_items")
    .select("kind,status,slug,title,excerpt,body,category,author_name,read_time,source_url,video_url,video_id,video_title,featured,metadata,published_at,updated_at")
    .eq("kind", kind)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Published content query failed", error);
    return null;
  }

  return (data ?? []) as PublishedContentRow[];
}

const getCachedPublishedRows = unstable_cache(queryPublishedRows, ["published-content"], {
  tags: ["published-content"],
  revalidate: 300,
});

export async function getPublishedBlogPosts() {
  const rows = await getCachedPublishedRows("blog_post");
  if (!rows) return blogPosts;
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
  if (!rows) return getAllGuides();
  return rows.map(rowToGuide).sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

export async function getPublishedGuideBySlug(slug: string) {
  const rows = await getCachedPublishedRows("guide");
  if (!rows) return getGuideBySlug(slug);
  const row = rows.find((item) => item.slug === slug);
  return row ? rowToGuide(row) : null;
}

export async function getPublishedGuideSlugs() {
  const rows = await getCachedPublishedRows("guide");
  if (!rows) return getGuideSlugs();
  return rows.map((row) => row.slug);
}

export async function getPublishedAlumniStories() {
  const rows = await getCachedPublishedRows("alumni_story");
  if (!rows) return alumniStories;
  return rows.map(rowToAlumniStory);
}
