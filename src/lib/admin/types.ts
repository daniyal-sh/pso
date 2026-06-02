export const adminSubjects = ["Astronomy", "Biology", "Chemistry", "Mathematics", "Physics"] as const;
export const moderatorPermissionKinds = ["resources_subject", "blog", "guide"] as const;
export const adminMemberStatuses = ["active", "disabled"] as const;
export const contentKinds = ["blog_post", "guide", "alumni_story", "resource", "past_paper", "question", "solution"] as const;
export const contentStatuses = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"] as const;

export type AdminSubject = (typeof adminSubjects)[number];
export type ModeratorPermissionKind = (typeof moderatorPermissionKinds)[number];
export type AdminMemberStatus = (typeof adminMemberStatuses)[number];
export type ContentKind = (typeof contentKinds)[number];
export type ContentStatus = (typeof contentStatuses)[number];

export type AdminPermissions = {
  blogs: boolean;
  guides: boolean;
  resourceSubjects: AdminSubject[];
};

export type AdminMember = {
  id: string;
  email: string;
  displayName: string;
  status: AdminMemberStatus;
  isOwner: boolean;
  lastLoginAt: string | null;
};

export type AdminContext = {
  isConfigured: boolean;
  user: {
    id: string;
    email: string;
  } | null;
  profile: {
    displayName: string;
    avatarUrl: string;
  } | null;
  member: AdminMember | null;
  permissions: AdminPermissions;
};

export type ContentListItem = {
  id: string;
  kind: ContentKind;
  status: ContentStatus;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  authorName: string;
  readTime: string;
  featured: boolean;
  createdBy: string | null;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
};

export type ContentEditorItem = ContentListItem & {
  body: string;
  sourceUrl: string;
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  coverImageUrl: string;
  metadata: Record<string, unknown>;
};

export type AdminDashboardData = {
  metrics: {
    totalContent: number;
    publishedContent: number;
    reviewQueue: number;
    scheduledContent: number;
    resources: number;
    pastPapers: number;
    questions: number;
    admins: number;
  };
  content: ContentListItem[];
  source: "supabase" | "unavailable";
};

export type ActionState = {
  ok: boolean;
  message: string;
  email?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ResourceAdminItem = {
  id: string;
  status: ContentStatus;
  title: string;
  description: string;
  subject: AdminSubject;
  kind: string;
  folder: string;
  year: number | null;
  pages: number;
  sizeBytes: number;
  localUrl: string;
  sourceUrl: string;
  createdBy: string | null;
  updatedAt: string;
};

export type ModeratorAdminItem = AdminMember & {
  permissions: AdminPermissions;
  createdAt: string;
  updatedAt: string;
};
