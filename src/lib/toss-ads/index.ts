import type { TossRuntime } from '../toss';

export type TossAdsClient = {
  isAvailable: boolean;
};

export function createTossAdsClient(toss: TossRuntime): TossAdsClient {
  return {
    isAvailable: toss.isInTossApp && toss.sdk !== null,
  };
}
