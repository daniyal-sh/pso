import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const revalidateSchema = z.object({
  secret: z.string().min(16),
  path: z.string().startsWith("/").optional(),
  tag: z.string().optional().default("published-content"),
});

function secretMatches(candidate: string, expected: string | undefined) {
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const payload = revalidateSchema.safeParse(await request.json().catch(() => ({})));
  if (!payload.success || !secretMatches(payload.data.secret, process.env.CONTENT_REVALIDATION_SECRET)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  revalidateTag(payload.data.tag, "max");
  if (payload.data.path) revalidatePath(payload.data.path);

  return NextResponse.json({
    ok: true,
    revalidated: {
      tag: payload.data.tag,
      path: payload.data.path ?? null,
    },
  });
}
