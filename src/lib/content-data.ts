export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  kind: string;
  folder: string;
  year: number | null;
  pages: number;
  sizeBytes: number;
  localUrl: string | null;
  sourceUrl: string;
};

export type PastPaper = {
  id: string;
  title: string;
  exam: string;
  subject: string;
  year: number;
  pages: number;
  resourceUrl: string | null;
  sourceUrl: string;
  scanned: boolean;
  pageImages: string[];
  questionCount: number;
  mcqCount: number;
  descriptiveCount: number;
  partICount: number;
  partIICount: number;
};

export type Question = {
  id: string;
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
  year: number;
  source: string;
  prompt: string;
  options: string[];
  answer: number | null;
  solution: string;
  page: number | null;
  figure: string;
};

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
