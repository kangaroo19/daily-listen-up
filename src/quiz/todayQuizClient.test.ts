import { describe, expect, test, vi } from "vitest";

import { SESSION_TOKEN_STORAGE_KEY } from "../auth/loginFlow";
import { loadTodayQuiz } from "./todayQuizClient";

function createStorage(sessionToken: string | null) {
  return {
    getItem: vi.fn((key: string) =>
      key === SESSION_TOKEN_STORAGE_KEY ? sessionToken : null,
    ),
  };
}

describe("loadTodayQuiz", () => {
  test("loads today quiz with the stored session token", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "available",
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
          isCorrect: false,
          canRetry: false,
          canViewScript: false,
          rewardStatus: "none",
          needsRewardReview: false,
        },
      }),
    });

    const result = await loadTodayQuiz({
      apiBaseUrl: "http://localhost:4000",
      fetch,
      storage: createStorage("session-token"),
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/today-quiz", {
      headers: { Authorization: "Bearer session-token" },
    });
    expect(result.status).toBe("available");
  });

  test("returns the empty state when the server has no quiz for today", async () => {
    const result = await loadTodayQuiz({
      apiBaseUrl: "http://localhost:4000",
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "empty",
          quiz: null,
          progress: null,
        }),
      }),
      storage: createStorage("session-token"),
    });

    expect(result).toEqual({
      status: "empty",
      quiz: null,
      progress: null,
    });
  });

  test("fails before calling the API when the stored session token is missing", async () => {
    const fetch = vi.fn();

    await expect(
      loadTodayQuiz({
        apiBaseUrl: "http://localhost:4000",
        fetch,
        storage: createStorage(null),
      }),
    ).rejects.toThrow("Session token is required");

    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails when the API request fails", async () => {
    await expect(
      loadTodayQuiz({
        apiBaseUrl: "http://localhost:4000",
        fetch: vi.fn().mockResolvedValue({ ok: false }),
        storage: createStorage("session-token"),
      }),
    ).rejects.toThrow("Today quiz request failed");
  });
});
