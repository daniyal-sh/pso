import "server-only";

import type {
  IoiContestStatus,
  IoiDayResult,
  IoiLiveSnapshot,
  IoiParticipantResult,
  IoiProblem,
  IoiProblemResult,
} from "@/lib/ioi-live-types";

const OFFICIAL_RESULTS_URL = "https://ranking.ioi2026.uz/";
const PAKISTAN_TEAM_ID = "PAK";
const DAY_FALLBACKS = {
  day1: { begin: 1786420800, end: 1786438800, dateLabel: "11 August" },
  day2: { begin: 1786593600, end: 1786611600, dateLabel: "13 August" },
} as const;

type OfficialContest = {
  name: string;
  begin: number;
  end: number;
  score_precision: number;
};

type OfficialTask = {
  name: string;
  short_name: string;
  contest: string;
  max_score: number;
  order: number;
};

type OfficialTeam = { name: string };
type OfficialUser = { f_name: string; l_name: string; team: string | null };
type OfficialScores = Record<string, Record<string, number>>;
type OfficialSubmission = { task: string; time: number; score: number };

async function getOfficialJson<T>(path: string): Promise<T> {
  const response = await fetch(`${OFFICIAL_RESULTS_URL}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Official IOI results returned ${response.status} for ${path}`);
  }

  return response.json() as Promise<T>;
}

function scoreForTasks(scores: Record<string, number> | undefined, tasks: IoiProblem[]) {
  return tasks.reduce((total, task) => total + (scores?.[task.id] ?? 0), 0);
}

function rankScores(rows: { id: string; score: number }[]) {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const ranks = new Map<string, number>();
  let previousScore: number | null = null;
  let previousRank = 0;

  sorted.forEach((row, index) => {
    if (previousScore === null || row.score !== previousScore) previousRank = index + 1;
    ranks.set(row.id, previousRank);
    previousScore = row.score;
  });

  return ranks;
}

function contestStatus(begin: number, end: number): IoiContestStatus {
  const now = Date.now() / 1000;
  if (now < begin) return "upcoming";
  if (now < end) return "live";
  return "complete";
}

function submissionsForProblem(submissions: OfficialSubmission[], problemId: string): IoiProblemResult {
  const matching = submissions.filter((submission) => submission.task === problemId);
  const latest = matching.reduce<OfficialSubmission | null>(
    (current, submission) => (!current || submission.time > current.time ? submission : current),
    null,
  );

  return {
    problemId,
    score: 0,
    submissions: matching.length,
    lastSubmissionAt: latest ? new Date(latest.time * 1000).toISOString() : null,
  };
}

export async function getIoiLiveSnapshot(): Promise<IoiLiveSnapshot> {
  const [contests, officialTasks, teams, users, scores] = await Promise.all([
    getOfficialJson<Record<string, OfficialContest>>("contests/"),
    getOfficialJson<Record<string, OfficialTask>>("tasks/"),
    getOfficialJson<Record<string, OfficialTeam>>("teams/"),
    getOfficialJson<Record<string, OfficialUser>>("users/"),
    getOfficialJson<OfficialScores>("scores"),
  ]);

  const pakistanUserIds = Object.entries(users)
    .filter(([, user]) => user.team === PAKISTAN_TEAM_ID)
    .map(([id]) => id)
    .sort();
  const pakistanSubmissions = await Promise.all(
    pakistanUserIds.map(async (id) => {
      try {
        return [id, await getOfficialJson<OfficialSubmission[]>(`sublist/${id}`)] as const;
      } catch {
        return [id, [] as OfficialSubmission[]] as const;
      }
    }),
  );
  const submissionMap = new Map(pakistanSubmissions);

  const days = (["day1", "day2"] as const).map((dayId): IoiDayResult => {
    const fallback = DAY_FALLBACKS[dayId];
    const contest = contests[dayId];
    const begin = contest?.begin ?? fallback.begin;
    const end = contest?.end ?? fallback.end;
    const problems = Object.entries(officialTasks)
      .filter(([, task]) => task.contest === dayId)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([id, task]): IoiProblem => ({
        id,
        name: task.name,
        shortName: task.short_name,
        maxScore: task.max_score,
      }));

    const rankedUsers = Object.entries(users)
      .filter(([, user]) => user.team && !user.team.startsWith("IOI"))
      .map(([id]) => ({ id, score: scoreForTasks(scores[id], problems) }));
    const individualRanks = rankScores(rankedUsers);

    const countryTotals = new Map<string, number>();
    for (const [id, user] of Object.entries(users)) {
      if (!user.team || user.team.startsWith("IOI") || !teams[user.team]) continue;
      countryTotals.set(user.team, (countryTotals.get(user.team) ?? 0) + scoreForTasks(scores[id], problems));
    }
    const countryRanks = rankScores([...countryTotals].map(([id, score]) => ({ id, score })));

    const participants = pakistanUserIds.map((id): IoiParticipantResult => {
      const user = users[id];
      const submissions = submissionMap.get(id) ?? [];
      const problemResults = problems.map((problem) => ({
        ...submissionsForProblem(submissions, problem.id),
        score: scores[id]?.[problem.id] ?? 0,
      }));

      return {
        id,
        name: [user.f_name, user.l_name].filter(Boolean).join(" "),
        rank: individualRanks.get(id) ?? rankedUsers.length,
        score: scoreForTasks(scores[id], problems),
        problems: problemResults,
      };
    });

    return {
      id: dayId,
      label: dayId === "day1" ? "Day 1" : "Day 2",
      dateLabel: fallback.dateLabel,
      begin: new Date(begin * 1000).toISOString(),
      end: new Date(end * 1000).toISOString(),
      status: contestStatus(begin, end),
      problems,
      participants,
      pakistanScore: countryTotals.get(PAKISTAN_TEAM_ID) ?? 0,
      pakistanCountryRank: problems.length ? (countryRanks.get(PAKISTAN_TEAM_ID) ?? null) : null,
      countryCount: countryTotals.size,
    };
  });

  return {
    source: OFFICIAL_RESULTS_URL,
    generatedAt: new Date().toISOString(),
    days,
  };
}

export function getUnavailableIoiSnapshot(): IoiLiveSnapshot {
  const participants = [
    ["PAK1", "Muhammad Aneeq"],
    ["PAK2", "Muhammad Saram"],
    ["PAK3", "Faisal"],
    ["PAK4", "Jawad Akbar Khan"],
  ];

  return {
    source: OFFICIAL_RESULTS_URL,
    generatedAt: new Date().toISOString(),
    days: (["day1", "day2"] as const).map((dayId) => {
      const fallback = DAY_FALLBACKS[dayId];
      return {
        id: dayId,
        label: dayId === "day1" ? "Day 1" : "Day 2",
        dateLabel: fallback.dateLabel,
        begin: new Date(fallback.begin * 1000).toISOString(),
        end: new Date(fallback.end * 1000).toISOString(),
        status: contestStatus(fallback.begin, fallback.end),
        problems: [],
        participants: participants.map(([id, name]) => ({ id, name, rank: 0, score: 0, problems: [] })),
        pakistanScore: 0,
        pakistanCountryRank: null,
        countryCount: 0,
      };
    }),
  };
}
