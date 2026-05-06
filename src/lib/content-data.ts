import pastPapersJson from "@/data/past-papers.json";
import questionsJson from "@/data/questions.json";
import resourcesJson from "@/data/resources.json";

export type ResourceItem = {
  id: string;
  title: string;
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
};

export type Question = {
  id: string;
  paperId: string;
  number: number;
  subject: string;
  topic: string;
  difficulty: string;
  type: "MCQ" | "Long";
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

export const resources = resourcesJson as ResourceItem[];
export const pastPapers = pastPapersJson as PastPaper[];
export const questions = questionsJson as Question[];

export function getPaperById(id: string) {
  return pastPapers.find((paper) => paper.id === id) ?? null;
}

export function getQuestionsForPaper(id: string) {
  return questions.filter((question) => question.paperId === id);
}

export function getQuestionStats() {
  const subjects = new Set(questions.map((question) => question.subject));
  const papers = new Set(questions.map((question) => question.paperId).filter(Boolean));
  return {
    total: questions.length,
    subjects: subjects.size,
    papers: papers.size,
    mcqs: questions.filter((question) => question.type === "MCQ").length,
    long: questions.filter((question) => question.type === "Long").length,
  };
}

export function getResourceStats() {
  return {
    total: resources.length,
    local: resources.filter((resource) => resource.localUrl).length,
    external: resources.filter((resource) => !resource.localUrl).length,
    subjects: new Set(resources.map((resource) => resource.subject)).size,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
