import type { ProgressStatus, RewardGrant, RewardStatus, UserProgress } from '../domain/models.js';

export type RewardStatusResult = {
  quizDate: string;
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
};

export function resolveRewardStatus(
  progress: UserProgress | null,
  rewardGrant: RewardGrant | null,
  quizDate: string,
): RewardStatusResult {
  if (progress == null) {
    return {
      quizDate,
      progressStatus: 'not_started',
      rewardStatus: 'none',
    };
  }

  return {
    quizDate,
    progressStatus: progress.progressStatus,
    rewardStatus: rewardGrant?.status ?? progress.rewardStatus,
  };
}
