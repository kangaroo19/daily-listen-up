import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { RewardGrant } from '../domain/models.js';

export async function findRewardGrant(userId: string, quizDate: string): Promise<RewardGrant | null> {
  const snapshot = await getFirestore()
    .collection(collections.rewardGrants)
    .where('userId', '==', userId)
    .where('quizDate', '==', quizDate)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as RewardGrant;
}
