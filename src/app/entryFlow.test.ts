import { describe, expect, test, vi } from "vitest";

import {
  SESSION_EXPIRES_AT_STORAGE_KEY,
  SESSION_TOKEN_STORAGE_KEY,
} from "../auth/loginFlow";
import { resolveEntryRoute } from "./entryFlow";

function createStorage(sessionToken: string | null) {
  const values = new Map<string, string>();

  if (sessionToken != null) {
    values.set(SESSION_TOKEN_STORAGE_KEY, sessionToken);
    values.set(SESSION_EXPIRES_AT_STORAGE_KEY, "2026-05-18T15:00:00.000Z");
  }

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
}

function availableTodayQuiz(isCorrect: boolean) {
  return {
    status: "available" as const,
    quiz: {
      id: "quiz-1",
      quizDate: "2026-05-18",
      questionText: "정답이라고 생각하는 답을 모두 골라주세요",
      audioUrl: "https://example.com/audio.mp3",
      choices: [
        { id: "choice-a", text: "첫 번째 선택지" },
        { id: "choice-b", text: "두 번째 선택지" },
        { id: "choice-c", text: "세 번째 선택지" },
        { id: "choice-d", text: "네 번째 선택지" },
        { id: "choice-e", text: "다섯 번째 선택지" },
      ],
      promotionAmount: 10,
    },
    progress: {
      attemptCount: 0,
      lastSubmittedChoiceIds: [],
      isCorrect,
      canRetry: false,
      canViewScript: false,
      rewardStatus: "none" as const,
      needsRewardReview: false,
    },
  };
}

describe("resolveEntryRoute", () => {
  test("keeps users without a session on home", async () => {
    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch: vi.fn(),
      storage: createStorage(null),
    });

    expect(result).toEqual({ route: "/", homeState: "idle" });
  });

  test("clears the session and returns home when session verification fails", async () => {
    const storage = createStorage("session-token");

    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch: vi.fn().mockResolvedValue({ ok: false }),
      storage,
    });

    expect(result).toEqual({ route: "/", homeState: "idle" });
    expect(storage.removeItem).toHaveBeenCalledWith(SESSION_TOKEN_STORAGE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(
      SESSION_EXPIRES_AT_STORAGE_KEY,
    );
  });

  test("shows the home empty state when today has no quiz", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "empty",
          quiz: null,
          progress: null,
        }),
      });

    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      storage: createStorage("session-token"),
    });

    expect(result).toEqual({ route: "/", homeState: "empty" });
  });

  test("routes to quiz when today has an unfinished quiz", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => availableTodayQuiz(false),
      });

    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      storage: createStorage("session-token"),
    });

    expect(result.route).toBe("/quiz");
    expect(result.todayQuiz?.status).toBe("available");
  });

  test("routes to result when today's quiz is already complete", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => availableTodayQuiz(true),
      });

    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      storage: createStorage("session-token"),
    });

    expect(result.route).toBe("/result");
    expect(result.todayQuiz?.status).toBe("available");
  });

  test("returns a retryable error state when today quiz loading fails", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });

    const result = await resolveEntryRoute({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      storage: createStorage("session-token"),
    });

    expect(result).toEqual({ route: "/", homeState: "quizError" });
  });
});
