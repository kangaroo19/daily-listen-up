import { describe, expect, test, vi } from "vitest";

import {
  SESSION_EXPIRES_AT_STORAGE_KEY,
  SESSION_TOKEN_STORAGE_KEY,
  performTossLogin,
} from "./loginFlow";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("performTossLogin", () => {
  test("sends the appLogin authorization code to the server and stores the session", async () => {
    const storage = createStorage();
    const appLogin = vi.fn().mockResolvedValue({
      authorizationCode: "auth-code",
      referrer: "DEFAULT",
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionToken: "session-token",
          expiresAt: "2026-05-18T15:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: "user-1" },
          session: { expiresAt: "2026-05-18T15:00:00.000Z" },
          today: { quizDate: "2026-05-18", progress: null },
        }),
      });

    await performTossLogin({
      apiBaseUrl: "http://localhost:4000",
      appLogin,
      fetch,
      storage,
    });

    expect(appLogin).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:4000/api/login/toss",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizationCode: "auth-code",
          referrer: "DEFAULT",
        }),
      },
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      SESSION_TOKEN_STORAGE_KEY,
      "session-token",
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      SESSION_EXPIRES_AT_STORAGE_KEY,
      "2026-05-18T15:00:00.000Z",
    );
    expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:4000/api/me", {
      headers: { Authorization: "Bearer session-token" },
    });
  });

  test("does not call appLogin when the API base URL is empty", async () => {
    const appLogin = vi.fn();

    await expect(
      performTossLogin({
        apiBaseUrl: "",
        appLogin,
        fetch: vi.fn(),
        storage: createStorage(),
      }),
    ).rejects.toThrow("API base URL is required");

    expect(appLogin).not.toHaveBeenCalled();
  });

  test("clears the stored session when session verification fails", async () => {
    const storage = createStorage();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionToken: "session-token",
          expiresAt: "2026-05-18T15:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(
      performTossLogin({
        apiBaseUrl: "http://localhost:4000",
        appLogin: vi.fn().mockResolvedValue({
          authorizationCode: "auth-code",
          referrer: "SANDBOX",
        }),
        fetch,
        storage,
      }),
    ).rejects.toThrow("Session verification failed");

    expect(storage.removeItem).toHaveBeenCalledWith(SESSION_TOKEN_STORAGE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(
      SESSION_EXPIRES_AT_STORAGE_KEY,
    );
  });
});
