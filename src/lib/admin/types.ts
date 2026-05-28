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

export type ResourceAdminItem = {
  id: string;
  status: ContentStatus;
  title: string;
  description: string;
  subject: string;
  kind: string;
  folder: string;
  year: number | null;
  pages: number;
  sizeBytes: number;
  localUrl: string;
  sourceUrl: string;
  updatedAt: string;
};

export type PastPaperAdminItem = {
  id: string;
  status: ContentStatus;
  title: string;
  exam: string;
  subject: string;
  year: number;
  pages: number;
  resourceUrl: string;
  sourceUrl: string;
  scanned: boolean;
  pageImages: string[];
  questionCount: number;
  mcqCount: number;
  descriptiveCount: number;
  partICount: number;
  partIICount: number;
  updatedAt: string;
};

export type QuestionAdminItem = {
  id: string;
  status: ContentStatus;
  paperId: string;
  paperSubject: string;
  number: number;
  displayNumber: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: "MCQ" | "Long";
  section: string;
  sectionTitle: string;
  exam: string;
  year: number | null;
  source: string;
  prompt: string;
  options: string[];
  answer: number | null;
  solution: string;
  page: number | null;
  figure: string;
  updatedAt: string;
};

export type ContributorAdminItem = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: AdminRole;
  requireMfa: boolean;
  updatedAt: string;
};
