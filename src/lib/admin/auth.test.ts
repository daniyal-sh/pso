import { describe, expect, it } from "vitest";
import { canDelete, canManageContentKind, canManageResourceSubject, hasAdminAccess, isOwner, permissionsFromRows } from "@/lib/admin/auth";
import type { AdminContext } from "@/lib/admin/types";

function context(overrides: Partial<AdminContext> = {}): AdminContext {
  return {
    isConfigured: true,
    user: { id: "user-1", email: "mod@example.com" },
    profile: null,
    member: { id: "member-1", email: "mod@example.com", displayName: "Mod", status: "active", isOwner: false, lastLoginAt: null },
    permissions: { blogs: false, guides: false, resourceSubjects: [] },
    ...overrides,
  };
}

describe("permissionsFromRows", () => {
  it("maps rows, ignores unknown subjects and de-duplicates", () => {
    expect(
      permissionsFromRows([
        { permission: "blog", subject: null },
        { permission: "resources_subject", subject: "Physics" },
        { permission: "resources_subject", subject: "Physics" },
        { permission: "resources_subject", subject: "Cooking" },
        { permission: "resources_subject", subject: "Biology" },
      ]),
    ).toEqual({ blogs: true, guides: false, resourceSubjects: ["Biology", "Physics"] });
  });
});

describe("admin access", () => {
  it("requires an active member", () => {
    expect(hasAdminAccess(context())).toBe(true);
    expect(hasAdminAccess(context({ member: { ...context().member!, status: "disabled" } }))).toBe(false);
    expect(hasAdminAccess(context({ member: null }))).toBe(false);
  });

  it("treats disabled owners as non-owners", () => {
    const owner = context({ member: { ...context().member!, isOwner: true } });
    expect(isOwner(owner)).toBe(true);
    expect(canDelete(owner)).toBe(true);
    expect(isOwner(context({ member: { ...context().member!, isOwner: true, status: "disabled" } }))).toBe(false);
  });
});

describe("content permissions", () => {
  const blogger = context({ permissions: { blogs: true, guides: false, resourceSubjects: [] } });

  it("lets blog moderators manage only their own blog posts", () => {
    expect(canManageContentKind(blogger, "blog_post")).toBe(true);
    expect(canManageContentKind(blogger, "blog_post", { createdBy: "user-1" })).toBe(true);
    expect(canManageContentKind(blogger, "blog_post", { createdBy: "someone-else" })).toBe(false);
    expect(canManageContentKind(blogger, "blog_post", { createdBy: null })).toBe(false);
  });

  it("does not grant other content kinds", () => {
    expect(canManageContentKind(blogger, "guide")).toBe(false);
    expect(canManageContentKind(blogger, "alumni_story")).toBe(false);
    expect(canDelete(blogger)).toBe(false);
  });
});

describe("resource permissions", () => {
  it("limits moderators to their assigned subjects", () => {
    const physics = context({ permissions: { blogs: false, guides: false, resourceSubjects: ["Physics"] } });
    expect(canManageResourceSubject(physics, "Physics")).toBe(true);
    expect(canManageResourceSubject(physics, "Biology")).toBe(false);
    expect(canManageResourceSubject(physics, null)).toBe(false);
  });
});
