export type IoiContestStatus = "upcoming" | "live" | "complete";

export type IoiProblem = {
  id: string;
  name: string;
  shortName: string;
  maxScore: number;
};
export type IoiProblemResult = {
  problemId: string;
  score: number;
  submissions: number;
  lastSubmissionAt: string | null;
  submissionHistory: IoiSubmission[];
};

export type IoiSubmission = {
  id: string;
  submittedAt: string;
  elapsedSeconds: number;
  score: number;
  token: boolean;
  subtasks: number[];
};

export type IoiParticipantResult = {
  id: string;
  name: string;
  rank: number;
  score: number;
  problems: IoiProblemResult[];
};

export type IoiDayResult = {
  id: "day1" | "day2";
  label: string;
  dateLabel: string;
  begin: string;
  end: string;
  status: IoiContestStatus;
  problems: IoiProblem[];
  participants: IoiParticipantResult[];
  pakistanScore: number;
  pakistanCountryRank: number | null;
  countryCount: number;
};

export type IoiLiveSnapshot = {
  source: string;
  generatedAt: string;
  days: IoiDayResult[];
};
