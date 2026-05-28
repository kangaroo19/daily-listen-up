import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { Quiz } from '../domain/models.js';

export async function findPublishedQuizByDate(quizDate: string): Promise<Quiz | null> {
  const snapshot = await getFirestore()
    .collection(collections.quizzes)
    .where('quizDate', '==', quizDate)
    .where('isPublished', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Quiz;
}
