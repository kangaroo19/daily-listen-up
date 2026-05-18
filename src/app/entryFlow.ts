import {
  SESSION_EXPIRES_AT_STORAGE_KEY,
  SESSION_TOKEN_STORAGE_KEY,
} from "../auth/loginFlow";
import { loadTodayQuiz, type TodayQuizResult } from "../quiz/todayQuizClient";

type Fetch = typeof globalThis.fetch;

type SessionStorageLike = Pick<Storage, "getItem" | "removeItem">;

export type HomeEntryState = "idle" | "empty" | "quizError";

export type EntryRouteResult =
  | {
      route: "/";
      homeState: HomeEntryState;
      todayQuiz?: never;
    }
  | {
      route: "/quiz" | "/result";
      homeState?: never;
      todayQuiz: TodayQuizResult;
    };

interface ResolveEntryRouteOptions {
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

function clearStoredSession(storage: SessionStorageLike) {
  storage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  storage.removeItem(SESSION_EXPIRES_AT_STORAGE_KEY);
}

export async function resolveEntryRoute({
  apiBaseUrl,
  fetch,
  storage,
}: ResolveEntryRouteOptions): Promise<EntryRouteResult> {
  const sessionToken = storage.getItem(SESSION_TOKEN_STORAGE_KEY);

  if (sessionToken == null || sessionToken.trim() === "") {
    return { route: "/", homeState: "idle" };
  }

  const meResponse = await fetch(buildApiUrl(apiBaseUrl, "/api/me"), {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (!meResponse.ok) {
    clearStoredSession(storage);
    return { route: "/", homeState: "idle" };
  }

  let todayQuiz: TodayQuizResult;

  try {
    todayQuiz = await loadTodayQuiz({ apiBaseUrl, fetch, storage });
  } catch {
    return { route: "/", homeState: "quizError" };
  }

  if (todayQuiz.status === "empty") {
    return { route: "/", homeState: "empty" };
  }

  return {
    route: todayQuiz.progress.isCorrect ? "/result" : "/quiz",
    todayQuiz,
  };
}
