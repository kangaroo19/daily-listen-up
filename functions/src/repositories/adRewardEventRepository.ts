import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { AdRewardEvent } from '../domain/models.js';

export async function saveAdRewardEvent(event: AdRewardEvent): Promise<void> {
  await getFirestore().collection(collections.adRewardEvents).add(event);
}
