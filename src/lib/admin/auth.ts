import "server-only";

import { redirect } from "next/navigation";
import type { AdminContext, AdminRole } from "@/lib/admin/types";
import { createSupabaseServerClient, getSupabaseConfig } from "@/lib/supabase/server";

const roleRank: Record<AdminRole, number> = {
  owner: 4,
  editor: 3,
  reviewer: 2,
  contributor: 1,
};

export function canManageContent(role: AdminRole | null) {
  return role === "owner" || role === "editor" || role === "contributor";
}

export function canPublishContent(role: AdminRole | null) {
  return role === "owner" || role === "editor";
}

export function roleAtLeast(role: AdminRole | null, minimum: AdminRole) {
  if (!role) return false;
  return roleRank[role] >= roleRank[minimum];
}

export async function getAdminContext(): Promise<AdminContext> {
  const config = getSupabaseConfig();
  const base = {
    isConfigured: config.isConfigured,
    user: null,
    profile: null,
    role: null,
    mfaRequired: process.env.ADMIN_MFA_REQUIRED !== "false",
    mfaVerified: false,
  } satisfies AdminContext;

  if (!config.isConfigured) return base;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return base;

  const [{ data: role }, { data: profile }, assurance] = await Promise.all([
    supabase.from("admin_roles").select("role, require_mfa").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().catch(() => ({ data: null })),
  ]);

  return {
    isConfigured: true,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      displayName: profile?.display_name || user.email,
      avatarUrl: profile?.avatar_url || "",
    },
    role: (role?.role as AdminRole | undefined) ?? null,
    mfaRequired: Boolean(role?.require_mfa ?? base.mfaRequired),
    mfaVerified: assurance.data?.currentLevel === "aal2",
  };
}

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const context = await getAdminContext();

  if (!context.isConfigured) {
    return context;
  }

  if (!context.user || !context.role) {
    redirect("/admin");
  }

  if (allowedRoles && !allowedRoles.includes(context.role)) {
    redirect("/admin?error=forbidden");
  }

  return context;
}
