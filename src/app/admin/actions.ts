"use server";

import "server-only";

import { redirect } from "next/navigation";
import { contentFormSchema, moderatorAccessSchema, otpRequestSchema, otpVerifySchema, pastPaperFormSchema, questionFormSchema, resourceFormSchema, transitionSchema } from "@/lib/admin/schema";
import type { ActionState } from "@/lib/admin/types";
import { getAdminContext, requireAdminAccess, requireDatasetOwner, requireOwner } from "@/lib/admin/auth";
import { deleteContentItem, deleteResourceItem, saveContentItem, saveModeratorAccess, savePastPaperItem, saveQuestionItem, saveResourceItem, transitionContentItem } from "@/lib/admin/content";
import { createSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

const initialError = "Something went wrong. Please try again.";

function zodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): ActionState {
  const fieldErrors = error.flatten().fieldErrors;
  const firstError = Object.entries(fieldErrors).find(([, errors]) => errors?.length);
  return {
    ok: false,
    message: firstError ? `${firstError[0]}: ${firstError[1]?.[0]}` : "Please fix the highlighted fields.",
    fieldErrors,
  };
}

const genericOtpMessage = "If this email has access, a code was sent.";

export async function requestAdminOtpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = otpRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);

  const service = getSupabaseServiceClient();
  const { data: member } = service
    ? await service.from("admin_members").select("email,status").eq("email", parsed.data.email).eq("status", "active").maybeSingle()
    : { data: null };

  if (!member) {
    return { ok: true, message: genericOtpMessage, email: parsed.data.email };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add the Supabase environment variables first.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return { ok: true, message: genericOtpMessage, email: parsed.data.email };
}

export async function verifyAdminOtpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = otpVerifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add the Supabase environment variables first.",
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const service = getSupabaseServiceClient();
  if (!service || !data.user?.email) {
    await supabase.auth.signOut();
    return { ok: false, message: "Admin access could not be verified." };
  }

  const { data: member } = await service.from("admin_members").select("id,email,display_name,status,user_id").eq("email", data.user.email.toLowerCase()).eq("status", "active").maybeSingle();
  if (!member) {
    await supabase.auth.signOut();
    return { ok: false, message: "Admin access could not be verified." };
  }

  await service.from("admin_members").update({ user_id: data.user.id, last_login_at: new Date().toISOString() }).eq("id", member.id);
  await service.from("profiles").upsert({
      id: data.user.id,
    email: data.user.email,
    display_name: member.display_name || data.user.email,
    });

  redirect("/admin/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin");
}

export async function saveContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireAdminAccess();
  const parsed = contentFormSchema.safeParse({
    id: formData.get("id") || undefined,
    kind: formData.get("kind"),
    status: formData.get("status") || "draft",
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    category: formData.get("category"),
    authorName: formData.get("authorName"),
    readTime: formData.get("readTime"),
    sourceUrl: formData.get("sourceUrl"),
    videoUrl: formData.get("videoUrl"),
    videoId: formData.get("videoId"),
    videoTitle: formData.get("videoTitle"),
    coverImageUrl: formData.get("coverImageUrl"),
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    scheduledAt: formData.get("scheduledAt"),
    tags: formData.get("tags"),
    level: formData.get("level"),
  });

  if (!parsed.success) return zodError(parsed.error);

  try {
    const id = await saveContentItem(parsed.data, context);
    return {
      ok: true,
      message: `Saved content item ${id}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : initialError,
    };
  }
}

export async function transitionContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getAdminContext();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);

  try {
    await transitionContentItem(parsed.data.id, parsed.data.status, parsed.data.note, context);
    return {
      ok: true,
      message: `Moved content to ${parsed.data.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : initialError,
    };
  }
}

export async function transitionContentFormAction(formData: FormData) {
  const context = await getAdminContext();
  const parsed = transitionSchema.parse(Object.fromEntries(formData));
  await transitionContentItem(parsed.id, parsed.status, parsed.note, context);
}

export async function saveResourceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireAdminAccess();
  const parsed = resourceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);
  try {
    const result = await saveResourceItem(parsed.data, context, formData.get("resourceFile"));
    return { ok: true, message: `Saved resource ${result.id}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}

export async function savePastPaperAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireDatasetOwner();
  const parsed = pastPaperFormSchema.safeParse({
    ...Object.fromEntries(formData),
    scanned: formData.get("scanned") === "on",
  });
  if (!parsed.success) return zodError(parsed.error);
  try {
    const result = await savePastPaperItem(parsed.data, context);
    return { ok: true, message: `Saved past paper ${result.id}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}

export async function saveQuestionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireDatasetOwner();
  const parsed = questionFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);
  try {
    const result = await saveQuestionItem(parsed.data, context);
    return { ok: true, message: `Saved question ${result.id}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}

export async function saveModeratorAccessAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireOwner();
  const parsed = moderatorAccessSchema.safeParse({
    ...Object.fromEntries(formData),
    isOwner: formData.get("isOwner") === "on",
    canBlog: formData.get("canBlog") === "on",
    canGuide: formData.get("canGuide") === "on",
    resourceSubjects: formData.getAll("resourceSubjects"),
  });
  if (!parsed.success) return zodError(parsed.error);
  try {
    const id = await saveModeratorAccess(parsed.data, context);
    return { ok: true, message: `Updated access for ${id}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}

export async function deleteContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Content ID is required." };
  try {
    await deleteContentItem(id, context);
    return { ok: true, message: "Content deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}

export async function deleteResourceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Resource ID is required." };
  try {
    await deleteResourceItem(id, context);
    return { ok: true, message: "Resource deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : initialError };
  }
}
