import type { ProgressStatus, RewardGrant, RewardStatus, UserProgress } from '../domain/models.js';

export type RewardStatusResult = {
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
};

export function resolveRewardStatus(
  progress: UserProgress | null,
  rewardGrant: RewardGrant | null,
): RewardStatusResult {
  if (progress == null) {
    return {
      progressStatus: 'not_started',
      rewardStatus: 'none',
    };
  }

  return {
    progressStatus: progress.progressStatus,
    rewardStatus: rewardGrant?.status ?? progress.rewardStatus,
  };
}
