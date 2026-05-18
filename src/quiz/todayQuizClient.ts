import { SESSION_TOKEN_STORAGE_KEY } from "../auth/loginFlow";

type Fetch = typeof globalThis.fetch;

type SessionStorageLike = Pick<Storage, "getItem">;

export type PublicQuizChoice = {
  id: string;
  text: string;
};

export type PublicTodayQuiz = {
  id: string;
  quizDate: string;
  questionText: string;
  audioUrl: string;
  choices: PublicQuizChoice[];
  promotionAmount: number;
};

export type PublicUserProgress = {
  attemptCount: number;
  lastSubmittedChoiceIds: string[];
  isCorrect: boolean;
  canRetry: boolean;
  canViewScript: boolean;
  rewardStatus: "none" | "pending" | "success" | "failed";
  needsRewardReview: boolean;
};

export type TodayQuizResult =
  | {
      status: "available";
      quiz: PublicTodayQuiz;
      progress: PublicUserProgress;
    }
  | {
      status: "empty";
      quiz: null;
      progress: null;
    };

interface LoadTodayQuizOptions {
  apiBaseUrl: string | undefined;
  fetch: Fetch;
  storage: SessionStorageLike;
}

function buildApiUrl(apiBaseUrl: string | undefined, path: string) {
  if (apiBaseUrl == null || apiBaseUrl.trim() === "") {
    throw new Error("API base URL is required");
  }

  return new URL(path, apiBaseUrl).toString();
}

export async function loadTodayQuiz({
  apiBaseUrl,
  fetch,
  storage,
}: LoadTodayQuizOptions): Promise<TodayQuizResult> {
  const sessionToken = storage.getItem(SESSION_TOKEN_STORAGE_KEY);

  if (sessionToken == null || sessionToken.trim() === "") {
    throw new Error("Session token is required");
  }

  const response = await fetch(buildApiUrl(apiBaseUrl, "/api/today-quiz"), {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (!response.ok) {
    throw new Error("Today quiz request failed");
  }

  return (await response.json()) as TodayQuizResult;
}
