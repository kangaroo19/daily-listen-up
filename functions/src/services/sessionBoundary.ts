import type { Request } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { AppSession } from '../domain/models.js';
import { hashAppSessionToken } from './loginSession.js';

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

export async function requireAppSession(token: string, now = new Date()): Promise<AppSessionContext> {
  const sessionTokenId = hashAppSessionToken(token);
  const snapshot = await getFirestore().collection(collections.appSessions).doc(sessionTokenId).get();

  if (!snapshot.exists) {
    throw new Error('App session not found.');
  }

  const session = snapshot.data() as AppSession;

  if (session.expiresAt.toMillis() <= Timestamp.fromDate(now).toMillis()) {
    throw new Error('App session expired.');
  }

  return {
    sessionTokenId,
    userId: session.userId,
  };
}
