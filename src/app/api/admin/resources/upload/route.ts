import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSubjects } from "@/lib/admin/types";
import { canManageResourceSubject, getAdminContext, hasAdminAccess } from "@/lib/admin/auth";
import { createResourceUploadUrl } from "@/lib/admin/content";
import { slugify } from "@/lib/admin/schema";

export const runtime = "nodejs";

const uploadRequestSchema = z.object({
  id: z.string().trim().max(180).optional().default(""),
  subject: z.enum(adminSubjects),
  title: z.string().trim().max(240).optional().default(""),
  fileName: z.string().trim().min(1).max(300),
  fileType: z.string().trim().max(120).optional().default(""),
  fileSize: z.number().int().positive(),
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const context = await getAdminContext();
  if (!hasAdminAccess(context)) return jsonError("Admin access is required.", 401);

  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose a valid subject and file before uploading.");
  const { id, subject, title, fileName, fileType, fileSize } = parsed.data;

  if (!canManageResourceSubject(context, subject)) {
    return jsonError("You are not allowed to upload resources for this subject.", 403);
  }
  if (!id && title.length < 3) {
    return jsonError("Enter a title before uploading the resource file.");
  }

  const resourceId = id || `${slugify(subject)}-${slugify(title)}`;
  if (!resourceId) return jsonError("Resource needs a valid title before it can be saved.");

  try {
    const upload = await createResourceUploadUrl(subject, resourceId, { name: fileName, type: fileType, size: fileSize });
    return NextResponse.json({ ok: true, resourceId, ...upload });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed. Please try again.", 400);
  }
}
