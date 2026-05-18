export const SESSION_TOKEN_STORAGE_KEY = "daily-listen-up.sessionToken";
export const SESSION_EXPIRES_AT_STORAGE_KEY =
  "daily-listen-up.sessionExpiresAt";

export type AppLogin = () => Promise<{
  authorizationCode: string;
  referrer: "DEFAULT" | "SANDBOX";
}>;

type Fetch = typeof globalThis.fetch;

type SessionStorageLike = Pick<Storage, "removeItem" | "setItem">;

interface PerformTossLoginOptions {
  apiBaseUrl: string | undefined;
  appLogin: AppLogin;
  fetch: Fetch;
  storage: SessionStorageLike;
}

interface LoginResponse {
  sessionToken: string;
  expiresAt: string;
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

async function parseLoginResponse(response: Response): Promise<LoginResponse> {
  if (!response.ok) {
    throw new Error("Toss login failed");
  }

  const body = (await response.json()) as Partial<LoginResponse>;

  if (body.sessionToken == null || body.expiresAt == null) {
    throw new Error("Toss login failed");
  }

  return {
    sessionToken: body.sessionToken,
    expiresAt: body.expiresAt,
  };
}

export async function performTossLogin({
  apiBaseUrl,
  appLogin,
  fetch,
  storage,
}: PerformTossLoginOptions) {
  const loginUrl = buildApiUrl(apiBaseUrl, "/api/login/toss");
  const meUrl = buildApiUrl(apiBaseUrl, "/api/me");
  const { authorizationCode, referrer } = await appLogin();

  const loginResponse = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  const session = await parseLoginResponse(loginResponse);

  storage.setItem(SESSION_TOKEN_STORAGE_KEY, session.sessionToken);
  storage.setItem(SESSION_EXPIRES_AT_STORAGE_KEY, session.expiresAt);

  const meResponse = await fetch(meUrl, {
    headers: { Authorization: `Bearer ${session.sessionToken}` },
  });

  if (!meResponse.ok) {
    clearStoredSession(storage);
    throw new Error("Session verification failed");
  }
}
