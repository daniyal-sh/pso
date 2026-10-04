import { describe, expect, it } from "vitest";
import { contentFormSchema, moderatorAccessSchema, otpVerifySchema, slugify } from "@/lib/admin/schema";

const validContent = {
  kind: "blog_post",
  status: "draft",
  title: "How I prepared",
  slug: "how-i-prepared",
  excerpt: "A summary that is long enough for reviewers.",
  body: "A body that comfortably exceeds the fifty character minimum length.",
  category: "NSTC",
  authorName: "Editorial Team",
};

describe("contentFormSchema", () => {
  it("accepts a valid draft and derives metadata", () => {
    const parsed = contentFormSchema.parse({ ...validContent, tags: "nstc, physics, ", level: "Beginner" });
    expect(parsed.metadata).toEqual({ tags: ["nstc", "physics"], level: "Beginner" });
    expect(parsed.readTime).toBe("1 min");
  });

  it("derives the YouTube id from a watch URL", () => {
    const parsed = contentFormSchema.parse({ ...validContent, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(parsed.videoId).toBe("dQw4w9WgXcQ");
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://example.com/file"])("rejects non-http URL %s", (url) => {
    expect(contentFormSchema.safeParse({ ...validContent, sourceUrl: url }).success).toBe(false);
    expect(contentFormSchema.safeParse({ ...validContent, coverImageUrl: url }).success).toBe(false);
  });

  it("requires a date for scheduled content", () => {
    expect(contentFormSchema.safeParse({ ...validContent, status: "scheduled" }).success).toBe(false);
    expect(contentFormSchema.safeParse({ ...validContent, status: "scheduled", scheduledAt: "2030-01-01T09:00:00.000Z" }).success).toBe(true);
  });

  it("rejects malformed slugs", () => {
    expect(contentFormSchema.safeParse({ ...validContent, slug: "Not A Slug" }).success).toBe(false);
  });
});

describe("other schemas", () => {
  it("normalizes moderator emails", () => {
    expect(moderatorAccessSchema.parse({ email: " Mod@Example.com ", displayName: "Mod" }).email).toBe("mod@example.com");
  });

  it("accepts 6-8 digit OTP codes only", () => {
    expect(otpVerifySchema.safeParse({ email: "a@b.co", token: "123456" }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ email: "a@b.co", token: "12a456" }).success).toBe(false);
  });

  it("slugifies titles", () => {
    expect(slugify("Physics & Maths: 2025!")).toBe("physics-and-maths-2025");
  });
});
