import "server-only";

import { redirect } from "next/navigation";
import { adminSubjects, type AdminContext, type AdminMember, type AdminPermissions, type AdminSubject, type ContentKind } from "@/lib/admin/types";
import { createSupabaseServerClient, getSupabaseConfig, getSupabaseServiceClient } from "@/lib/supabase/server";

const emptyPermissions: AdminPermissions = {
  blogs: false,
  guides: false,
  resourceSubjects: [],
};

type PermissionRow = {
  permission: "resources_subject" | "blog" | "guide";
  subject: string | null;
};

type MemberRow = {
  id: string;
  email: string;
  user_id: string | null;
  display_name: string;
  status: "active" | "disabled";
  is_owner: boolean;
  last_login_at: string | null;
};

function normalizeSubject(value: string): AdminSubject | null {
  return adminSubjects.find((subject) => subject === value) ?? null;
}

export function permissionsFromRows(rows: PermissionRow[] | null | undefined): AdminPermissions {
  const permissions: AdminPermissions = { ...emptyPermissions, resourceSubjects: [] };
  for (const row of rows ?? []) {
    if (row.permission === "blog") permissions.blogs = true;
    if (row.permission === "guide") permissions.guides = true;
    if (row.permission === "resources_subject" && row.subject) {
      const subject = normalizeSubject(row.subject);
      if (subject && !permissions.resourceSubjects.includes(subject)) permissions.resourceSubjects.push(subject);
    }
  }
  permissions.resourceSubjects.sort();
  return permissions;
}

function rowToMember(row: MemberRow): AdminMember {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || row.email,
    status: row.status,
    isOwner: row.is_owner,
    lastLoginAt: row.last_login_at,
  };
}

export function isOwner(context: AdminContext) {
  return Boolean(context.member?.isOwner && context.member.status === "active");
}

export function hasAdminAccess(context: AdminContext) {
  return Boolean(context.user && context.member && context.member.status === "active");
}

export function canManageBlog(context: AdminContext, item?: { createdBy?: string | null } | null) {
  if (isOwner(context)) return true;
  if (!context.permissions.blogs || !context.user) return false;
  return !item || item.createdBy === context.user.id;
}

export function canManageGuide(context: AdminContext, item?: { createdBy?: string | null } | null) {
  if (isOwner(context)) return true;
  if (!context.permissions.guides || !context.user) return false;
  return !item || item.createdBy === context.user.id;
}

export function canManageContentKind(context: AdminContext, kind: ContentKind, item?: { createdBy?: string | null } | null) {
  if (isOwner(context)) return true;
  if (kind === "blog_post") return canManageBlog(context, item);
  if (kind === "guide") return canManageGuide(context, item);
  return false;
}

export function canManageResourceSubject(context: AdminContext, subject: string | null | undefined) {
  if (isOwner(context)) return true;
  const normalized = subject ? normalizeSubject(subject) : null;
  return Boolean(normalized && context.permissions.resourceSubjects.includes(normalized));
}

export function canPublishContent(context: AdminContext, kind: ContentKind, item?: { createdBy?: string | null } | null) {
  return canManageContentKind(context, kind, item);
}

export function canDelete(context: AdminContext) {
  return isOwner(context);
}

export async function getAdminContext(): Promise<AdminContext> {
  const config = getSupabaseConfig();
  const base: AdminContext = {
    isConfigured: config.isConfigured,
    user: null,
    profile: null,
    member: null,
    permissions: emptyPermissions,
  };

  if (!config.isConfigured) return base;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return base;

  const service = getSupabaseServiceClient();
  if (!service) return { ...base, user: { id: user.id, email: user.email } };

  const byUser = await service
    .from("admin_members")
    .select("id,email,user_id,display_name,status,is_owner,last_login_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const byEmail = byUser.data
    ? { data: null }
    : await service.from("admin_members").select("id,email,user_id,display_name,status,is_owner,last_login_at").eq("email", user.email.toLowerCase()).maybeSingle();
  const member = byUser.data ?? byEmail.data;

  if (!member || member.status !== "active") {
    return {
      ...base,
      user: { id: user.id, email: user.email },
    };
  }

  const [{ data: profile }, { data: permissionRows }] = await Promise.all([
    service.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    service.from("moderator_permissions").select("permission,subject").eq("member_id", member.id),
  ]);

  return {
    isConfigured: true,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      displayName: profile?.display_name || member.display_name || user.email,
      avatarUrl: profile?.avatar_url || "",
    },
    member: rowToMember(member as MemberRow),
    permissions: permissionsFromRows(permissionRows as PermissionRow[] | null),
  };
}

export async function requireAdminAccess() {
  const context = await getAdminContext();

  if (!context.isConfigured) return context;

  if (!hasAdminAccess(context)) {
    redirect("/admin");
  }

  return context;
}

export async function requireOwner() {
  const context = await requireAdminAccess();
  if (!isOwner(context)) redirect("/admin?error=forbidden");
  return context;
}

export async function requireBlogAccess() {
  const context = await requireAdminAccess();
  if (!isOwner(context) && !context.permissions.blogs) redirect("/admin?error=forbidden");
  return context;
}

export async function requireGuideAccess() {
  const context = await requireAdminAccess();
  if (!isOwner(context) && !context.permissions.guides) redirect("/admin?error=forbidden");
  return context;
}

export async function requireResourceAccess() {
  const context = await requireAdminAccess();
  if (!isOwner(context) && context.permissions.resourceSubjects.length === 0) redirect("/admin?error=forbidden");
  return context;
}

export const requireAdmin = requireAdminAccess;
