const APP_SESSION_TOKEN_KEY = 'daily-listen-up.appSessionToken';
const APP_SESSION_EXPIRES_AT_KEY = 'daily-listen-up.appSessionExpiresAt';

export type AppSession = {
  appSessionToken: string;
  expiresAt: string;
};

export function saveAppSession(session: AppSession, storage: Storage = window.sessionStorage): void {
  storage.setItem(APP_SESSION_TOKEN_KEY, session.appSessionToken);
  storage.setItem(APP_SESSION_EXPIRES_AT_KEY, session.expiresAt);
}

export function getAppSessionToken(storage: Storage = window.sessionStorage): string | null {
  return storage.getItem(APP_SESSION_TOKEN_KEY);
}

export function clearAppSession(storage: Storage = window.sessionStorage): void {
  storage.removeItem(APP_SESSION_TOKEN_KEY);
  storage.removeItem(APP_SESSION_EXPIRES_AT_KEY);
}
