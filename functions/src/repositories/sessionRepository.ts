import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { AppSession } from '../domain/models.js';
import type { SessionRepository } from '../services/loginSession.js';

export function createFirestoreSessionRepository(): SessionRepository {
  return {
    async save(tokenId, session) {
      await getFirestore().collection(collections.appSessions).doc(tokenId).set(session);
    },
  };
}
