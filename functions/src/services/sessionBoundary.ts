import type { Request } from 'firebase-functions/v2/https';

export type AppSessionContext = {
  sessionTokenId: string;
  userId: string;
};

export function getBearerToken(req: Request): string | null {
  const authorization = req.header('authorization');

  if (authorization == null || !authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

export async function requireAppSession(_token: string): Promise<AppSessionContext> {
  throw new Error('App session verification is implemented in task 03.');
}
