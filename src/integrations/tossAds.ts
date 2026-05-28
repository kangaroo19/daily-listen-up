export type TossAdPurpose = 'answer-result' | 'retry' | 'script';

export async function showTossAd(_purpose: TossAdPurpose): Promise<void> {
  throw new Error('Toss Ads flow is implemented in later tasks.');
}
