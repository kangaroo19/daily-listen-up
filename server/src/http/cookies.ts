export const SESSION_COOKIE_NAME = 'daily_listen_up_session';

export function readSessionId(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie');

  if (cookieHeader == null) {
    return undefined;
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');

    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return undefined;
}

export function createSessionCookie(sessionId: string, maxAgeSeconds: number) {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}
