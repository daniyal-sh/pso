"use server";

import "server-only";

import { redirect } from "next/navigation";
import { loginSchema, contentFormSchema, inviteSignupSchema, transitionSchema } from "@/lib/admin/schema";
import type { ActionState } from "@/lib/admin/types";
import { getAdminContext, requireAdmin } from "@/lib/admin/auth";
import { saveContentItem, transitionContentItem } from "@/lib/admin/content";
import { createSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

const initialError = "Something went wrong. Please try again.";

function zodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): ActionState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet. Add the Supabase environment variables first.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  redirect("/admin/dashboard");
}

export async function inviteSignupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inviteSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodError(parsed.error);

  if (!process.env.ADMIN_INVITE_CODE || parsed.data.inviteCode !== process.env.ADMIN_INVITE_CODE) {
    return {
      ok: false,
      message: "Invite code is invalid.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured yet.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const service = getSupabaseServiceClient();
  if (service && data.user) {
    await service.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      display_name: parsed.data.displayName,
    });
    await service.from("admin_roles").upsert({
      user_id: data.user.id,
      role: "contributor",
      require_mfa: process.env.ADMIN_MFA_REQUIRED !== "false",
    });
  }

  return {
    ok: true,
    message: data.user?.confirmed_at ? "Account created. You can sign in now." : "Account created. Confirm your email if Supabase requires it, then sign in.",
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin");
}

export async function saveContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireAdmin(["owner", "editor", "contributor"]);
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
    featured: formData.get("featured") === "on",
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
