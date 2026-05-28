import "server-only";

import { unstable_cache } from "next/cache";
import { pastPapers, questions, resources, type PastPaper, type Question, type ResourceItem } from "@/lib/content-data";
import { getSupabaseConfig, getSupabaseServiceClient } from "@/lib/supabase/server";

type ResourceRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  kind: string;
  folder: string;
  year: number | null;
  pages: number;
  size_bytes: number;
  local_url: string | null;
  source_url: string;
};

type PastPaperRow = {
  id: string;
  title: string;
  exam: string;
  subject: string;
  year: number;
  pages: number;
  resource_url: string | null;
  source_url: string;
  scanned: boolean;
  page_images: string[] | null;
  question_count: number;
  mcq_count: number;
  descriptive_count: number;
  part_i_count: number;
  part_ii_count: number;
};

type QuestionRow = {
  id: string;
  paper_id: string | null;
  paper_subject: string;
  number: number;
  display_number: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  section: string;
  section_title: string;
  exam: string;
  year: number | null;
  source: string;
  prompt: string;
  options: unknown;
  answer: number | null;
  solution: string;
  page: number | null;
  figure: string;
};

function rowToResource(row: ResourceRow): ResourceItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    kind: row.kind,
    folder: row.folder,
    year: row.year,
    pages: row.pages,
    sizeBytes: row.size_bytes,
    localUrl: row.local_url,
    sourceUrl: row.source_url,
  };
}

function rowToPastPaper(row: PastPaperRow): PastPaper {
  return {
    id: row.id,
    title: row.title,
    exam: row.exam,
    subject: row.subject,
    year: row.year,
    pages: row.pages,
    resourceUrl: row.resource_url,
    sourceUrl: row.source_url,
    scanned: row.scanned,
    pageImages: row.page_images ?? [],
    questionCount: row.question_count,
    mcqCount: row.mcq_count,
    descriptiveCount: row.descriptive_count,
    partICount: row.part_i_count,
    partIICount: row.part_ii_count,
  };
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    paperId: row.paper_id ?? "",
    paperSubject: row.paper_subject,
    number: row.number,
    displayNumber: row.display_number,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    type: row.type === "Long" ? "Long" : "MCQ",
    section: row.section,
    sectionTitle: row.section_title,
    exam: row.exam,
    year: row.year ?? 0,
    source: row.source,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    answer: row.answer,
    solution: row.solution,
    page: row.page,
    figure: row.figure,
  };
}

async function queryPublishedResources() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("resources")
    .select("id,title,description,subject,kind,folder,year,pages,size_bytes,local_url,source_url")
    .eq("status", "published")
    .order("subject", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("Published resources query failed", error);
    return null;
  }
  return (data ?? []).map((row) => rowToResource(row as ResourceRow));
}

async function queryPublishedPastPapers() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("past_papers")
    .select("id,title,exam,subject,year,pages,resource_url,source_url,scanned,page_images,question_count,mcq_count,descriptive_count,part_i_count,part_ii_count")
    .eq("status", "published")
    .order("year", { ascending: false })
    .order("subject", { ascending: true });

  if (error) {
    console.error("Published past papers query failed", error);
    return null;
  }
  return (data ?? []).map((row) => rowToPastPaper(row as PastPaperRow));
}

async function queryPublishedQuestions() {
  const supabase = getSupabaseServiceClient();
  if (!getSupabaseConfig().hasServiceRole || !supabase) return null;
  const { data, error } = await supabase
    .from("questions")
    .select("id,paper_id,paper_subject,number,display_number,subject,topic,difficulty,type,section,section_title,exam,year,source,prompt,options,answer,solution,page,figure")
    .eq("status", "published")
    .order("year", { ascending: true })
    .order("paper_id", { ascending: true })
    .order("number", { ascending: true });

  if (error) {
    console.error("Published questions query failed", error);
    return null;
  }
  return (data ?? []).map((row) => rowToQuestion(row as QuestionRow));
}

const getCachedPublishedResources = unstable_cache(queryPublishedResources, ["published-resources"], {
  tags: ["published-content", "published-resources"],
  revalidate: 300,
});

const getCachedPublishedPastPapers = unstable_cache(queryPublishedPastPapers, ["published-past-papers"], {
  tags: ["published-content", "published-past-papers"],
  revalidate: 300,
});

const getCachedPublishedQuestions = unstable_cache(queryPublishedQuestions, ["published-questions"], {
  tags: ["published-content", "published-questions"],
  revalidate: 300,
});

export async function getPublishedResources() {
  const rows = await getCachedPublishedResources();
  return rows ?? resources;
}

export async function getPublishedPastPapers() {
  const rows = await getCachedPublishedPastPapers();
  return rows ?? pastPapers;
}

export async function getDatabasePublishedPastPapers() {
  return (await getCachedPublishedPastPapers()) ?? [];
}

export async function getPublishedQuestions() {
  const rows = await getCachedPublishedQuestions();
  return rows ?? questions;
}

export async function getDatabasePublishedQuestions() {
  return (await getCachedPublishedQuestions()) ?? [];
}

export async function getPublishedPaperById(id: string) {
  const rows = await getPublishedPastPapers();
  return rows.find((paper) => paper.id === id) ?? null;
}

export async function getDatabasePublishedPaperById(id: string) {
  const rows = await getDatabasePublishedPastPapers();
  return rows.find((paper) => paper.id === id) ?? null;
}

export async function getPublishedQuestionsForPaper(id: string) {
  const rows = await getPublishedQuestions();
  return rows.filter((question) => question.paperId === id);
}

export async function getDatabasePublishedQuestionsForPaper(id: string) {
  const rows = await getDatabasePublishedQuestions();
  return rows.filter((question) => question.paperId === id);
}

export function getQuestionStatsForRows(rows: Question[]) {
  const subjects = new Set(rows.map((question) => question.subject));
  const papers = new Set(rows.map((question) => question.paperId).filter(Boolean));
  return {
    total: rows.length,
    subjects: subjects.size,
    papers: papers.size,
    mcqs: rows.filter((question) => question.type === "MCQ").length,
    long: rows.filter((question) => question.type === "Long").length,
  };
}

export function getResourceStatsForRows(rows: ResourceItem[]) {
  return {
    total: rows.length,
    local: rows.filter((resource) => resource.localUrl).length,
    external: rows.filter((resource) => !resource.localUrl).length,
    subjects: new Set(rows.map((resource) => resource.subject)).size,
  };
}
