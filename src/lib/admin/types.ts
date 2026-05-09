export const adminRoles = ["owner", "editor", "reviewer", "contributor"] as const;
export const contentKinds = ["blog_post", "guide", "alumni_story", "resource", "past_paper", "question", "solution"] as const;
export const contentStatuses = ["draft", "in_review", "changes_requested", "scheduled", "published", "archived"] as const;

export type AdminRole = (typeof adminRoles)[number];
export type ContentKind = (typeof contentKinds)[number];
export type ContentStatus = (typeof contentStatuses)[number];

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
  role: AdminRole | null;
  mfaRequired: boolean;
  mfaVerified: boolean;
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
  workflowEvents: {
    id: string;
    title: string;
    fromStatus: ContentStatus | null;
    toStatus: ContentStatus;
    note: string;
    createdAt: string;
  }[];
  auditLog: {
    id: string;
    action: string;
    entityTable: string;
    entityId: string;
    summary: string;
    createdAt: string;
  }[];
  source: "supabase" | "fallback";
};

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
