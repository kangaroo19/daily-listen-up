import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { UserProgress } from '../domain/models.js';

export async function findUserProgress(userId: string, quizDate: string): Promise<UserProgress | null> {
  const snapshot = await getFirestore()
    .collection(collections.userProgress)
    .where('userId', '==', userId)
    .where('quizDate', '==', quizDate)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as UserProgress;
}

export async function saveUserProgress(progress: UserProgress): Promise<void> {
  await getFirestore()
    .collection(collections.userProgress)
    .doc(`${progress.userId}_${progress.quizDate}`)
    .set(progress);
}
