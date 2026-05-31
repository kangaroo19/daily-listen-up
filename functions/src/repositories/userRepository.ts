import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { User } from '../domain/models.js';
import type { UserRepository } from '../services/loginSession.js';

export function createFirestoreUserRepository(): UserRepository {
  return {
    async findByUserKey(userKey) {
      const snapshot = await getFirestore()
        .collection(collections.users)
        .where('userKey', '==', userKey)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as User;
    },
    async save(user) {
      await getFirestore().collection(collections.users).doc(user.userId).set(user, { merge: true });
    },
  };
}
