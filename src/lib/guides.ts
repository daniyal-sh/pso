import fs from "node:fs";
import path from "node:path";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  readTime: string;
  author: string;
  updated: string;
  sourceUrl: string;
  tags: string[];
  featured: boolean;
  content: string;
};

const guidesDirectory = path.join(process.cwd(), "content", "guides");

function parseValue(value: string) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const data: Record<string, string | boolean | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    data[key] = parseValue(value);
  }

  return { data, content: match[2].trim() };
}

function coerceGuide(slug: string, raw: string): Guide {
  const { data, content } = parseFrontmatter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    category: String(data.category ?? "Guide"),
    level: String(data.level ?? "Beginner"),
    readTime: String(data.readTime ?? "10 min"),
    author: String(data.author ?? "Pakistan Olympiads"),
    updated: String(data.updated ?? "2024-05-01"),
    sourceUrl: String(data.sourceUrl ?? ""),
    tags: Array.isArray(data.tags) ? data.tags : [],
    featured: Boolean(data.featured ?? false),
    content,
  };
}

export function getAllGuides() {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(guidesDirectory, file), "utf8");
      return coerceGuide(slug, raw);
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

export function getGuideBySlug(slug: string) {
  const filePath = path.join(guidesDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return coerceGuide(slug, fs.readFileSync(filePath, "utf8"));
}

export function getGuideSlugs() {
  return getAllGuides().map((guide) => guide.slug);
}
