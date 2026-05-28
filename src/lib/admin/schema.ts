import { z } from "zod";
import { adminMemberStatuses, adminSubjects, contentKinds, contentStatuses } from "@/lib/admin/types";

const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalDate = z.preprocess(emptyStringToUndefined, z.string().datetime().optional());

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "");
}

export function calculateReadTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min`;
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function deriveYouTubeId(videoUrl: string, currentId: string) {
  if (currentId) return currentId;
  if (!videoUrl) return "";
  try {
    const url = new URL(videoUrl);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "");
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
  return "";
}

export const contentFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    kind: z.enum(contentKinds),
    status: z.enum(contentStatuses).default("draft"),
    title: z.string().trim().min(4, "Title must be at least 4 characters.").max(160),
    slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
    excerpt: z.string().trim().min(20, "Summary should help reviewers understand the piece.").max(360),
    body: z.string().trim().min(50, "Body must be at least 50 characters."),
    category: z.string().trim().min(2).max(60),
    authorName: z.string().trim().min(2).max(120),
    readTime: z.string().trim().max(30).optional(),
    sourceUrl: optionalUrl.default(""),
    videoUrl: optionalUrl.default(""),
    videoId: z.string().trim().max(32).optional().default(""),
    videoTitle: z.string().trim().max(160).optional().default(""),
    coverImageUrl: optionalUrl.default(""),
    featured: z.coerce.boolean().default(false),
    scheduledAt: optionalDate,
    tags: z.string().optional().default(""),
    level: z.string().trim().max(60).optional().default(""),
  })
  .transform((value) => {
    const videoId = deriveYouTubeId(value.videoUrl ?? "", value.videoId ?? "");
    return {
      ...value,
      videoId,
      readTime: value.readTime?.trim() || calculateReadTime(value.body),
      metadata: {
        tags: parseTags(value.tags),
        level: value.level,
      },
    };
  })
  .superRefine((value, ctx) => {
    if (value.videoId && !/^[a-zA-Z0-9_-]{11}$/.test(value.videoId)) {
      ctx.addIssue({
        code: "custom",
        path: ["videoId"],
        message: "YouTube video IDs must be 11 URL-safe characters.",
      });
    }
    if (value.status === "scheduled" && !value.scheduledAt) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Scheduled content needs a publish date.",
      });
    }
  });

export const otpRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  token: z.string().trim().regex(/^\d{6,8}$/, "Enter the code from your email."),
});

export const transitionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(contentStatuses),
  note: z.string().trim().max(500).optional().default(""),
});

const optionalNumber = z.preprocess(emptyStringToUndefined, z.coerce.number().finite().optional());
const nullableNumber = z.preprocess((value) => (value === "" ? null : value), z.coerce.number().finite().nullable());
const resourcePath = z.string().trim().max(700).optional().default("");

export const resourceFormSchema = z.object({
  id: z.string().trim().max(180).optional().default(""),
  status: z.enum(contentStatuses).default("published"),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(800).optional().default(""),
  subject: z.enum(adminSubjects),
  kind: z.string().trim().min(2).max(80),
  folder: z.string().trim().max(160).optional().default(""),
  year: nullableNumber.optional().default(null),
  pages: optionalNumber.default(0),
  sizeBytes: optionalNumber.default(0),
  localUrl: resourcePath,
  sourceUrl: resourcePath,
});

export const pastPaperFormSchema = z.object({
  id: z.string().trim().min(3).max(220),
  status: z.enum(contentStatuses).default("published"),
  title: z.string().trim().min(3).max(240),
  exam: z.string().trim().min(2).max(80).default("NSTC"),
  subject: z.string().trim().min(2).max(80),
  year: z.coerce.number().int().min(1900).max(2100),
  pages: optionalNumber.default(0),
  resourceUrl: resourcePath,
  sourceUrl: resourcePath,
  scanned: z.coerce.boolean().default(false),
  pageImages: z.string().optional().default(""),
  questionCount: optionalNumber.default(0),
  mcqCount: optionalNumber.default(0),
  descriptiveCount: optionalNumber.default(0),
  partICount: optionalNumber.default(0),
  partIICount: optionalNumber.default(0),
}).transform((value) => ({
  ...value,
  pageImages: value.pageImages.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
}));

export const questionFormSchema = z.object({
  id: z.string().trim().min(3).max(260),
  status: z.enum(contentStatuses).default("published"),
  paperId: z.string().trim().max(220).optional().default(""),
  paperSubject: z.string().trim().max(80).optional().default(""),
  number: z.coerce.number().int().min(1).max(999),
  displayNumber: z.string().trim().max(80).optional().default(""),
  subject: z.string().trim().min(2).max(80),
  topic: z.string().trim().max(120).optional().default(""),
  difficulty: z.string().trim().max(120).optional().default(""),
  type: z.enum(["MCQ", "Long"]).default("MCQ"),
  section: z.string().trim().max(80).optional().default(""),
  sectionTitle: z.string().trim().max(120).optional().default(""),
  exam: z.string().trim().max(80).optional().default("NSTC"),
  year: nullableNumber.optional().default(null),
  source: z.string().trim().max(240).optional().default(""),
  prompt: z.string().trim().min(3),
  options: z.string().optional().default(""),
  answer: nullableNumber.optional().default(null),
  solution: z.string().trim().optional().default(""),
  page: nullableNumber.optional().default(null),
  figure: resourcePath,
}).transform((value) => ({
  ...value,
  options: value.options.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
}));

export const moderatorAccessSchema = z.object({
  memberId: z.string().uuid().optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(120),
  status: z.enum(adminMemberStatuses).default("active"),
  isOwner: z.coerce.boolean().default(false),
  canBlog: z.coerce.boolean().default(false),
  canGuide: z.coerce.boolean().default(false),
  resourceSubjects: z.array(z.enum(adminSubjects)).default([]),
});
