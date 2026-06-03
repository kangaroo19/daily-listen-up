import { Timestamp } from 'firebase-admin/firestore';
import type { AdRewardEvent, ProgressStatus, Quiz, UserProgress } from '../domain/models.js';
import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { saveAdRewardEvent } from '../repositories/adRewardEventRepository.js';
import { findUserProgress, saveUserProgress } from '../repositories/userProgressRepository.js';

export type RewardedAdPurpose = 'retry' | 'script';

export type RewardedAdCompleteRequest = {
  userId: string;
  quizDate: string;
  purpose: RewardedAdPurpose;
  userEarnedReward: boolean;
};

export type RewardedAdCompleteResponse = {
  progressStatus: ProgressStatus;
  canViewScript: boolean;
  script?: string;
};

export type RewardedAdCompleteDependencies = {
  findPublishedQuizByDate(quizDate: string): Promise<Quiz | null>;
  findUserProgress(userId: string, quizDate: string): Promise<UserProgress | null>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  saveAdRewardEvent(event: AdRewardEvent): Promise<void>;
  createTimestamp(): FirebaseFirestore.Timestamp;
};

const defaultDependencies: RewardedAdCompleteDependencies = {
  findPublishedQuizByDate,
  findUserProgress,
  saveUserProgress,
  saveAdRewardEvent,
  createTimestamp: () => Timestamp.now(),
};

export class RewardedAdCompleteError extends Error {
  constructor(
    message: string,
    public readonly code: 'reward_not_earned' | 'quiz_not_found' | 'progress_not_found' | 'retry_not_allowed' | 'script_not_allowed',
  ) {
    super(message);
  }
}

export async function completeRewardedAd(
  request: RewardedAdCompleteRequest,
  dependencies: RewardedAdCompleteDependencies = defaultDependencies,
): Promise<RewardedAdCompleteResponse> {
  if (!request.userEarnedReward) {
    throw new RewardedAdCompleteError('Rewarded ad was not completed.', 'reward_not_earned');
  }

  const [quiz, progress] = await Promise.all([
    dependencies.findPublishedQuizByDate(request.quizDate),
    dependencies.findUserProgress(request.userId, request.quizDate),
  ]);

  if (quiz == null) {
    throw new RewardedAdCompleteError('Published quiz not found.', 'quiz_not_found');
  }

  if (progress == null) {
    throw new RewardedAdCompleteError('User progress not found.', 'progress_not_found');
  }

  if (request.purpose === 'retry') {
    if (progress.progressStatus !== 'wrong' && progress.progressStatus !== 'retry_unlocked') {
      throw new RewardedAdCompleteError('Retry is not allowed for this progress status.', 'retry_not_allowed');
    }

    await saveEarnedRewardEvent(request, dependencies);

    const nextProgress: UserProgress = {
      ...progress,
      progressStatus: 'retry_unlocked',
    };

    await dependencies.saveUserProgress(nextProgress);

    return {
      progressStatus: nextProgress.progressStatus,
      canViewScript: nextProgress.canViewScript,
    };
  }

  if (progress.progressStatus !== 'wrong' && progress.progressStatus !== 'retry_unlocked' && progress.progressStatus !== 'completed') {
    throw new RewardedAdCompleteError('Script view is not allowed for this progress status.', 'script_not_allowed');
  }

  await saveEarnedRewardEvent(request, dependencies);

  const nextProgress: UserProgress = {
    ...progress,
    canViewScript: true,
  };

  await dependencies.saveUserProgress(nextProgress);

  return {
    progressStatus: nextProgress.progressStatus,
    canViewScript: true,
    script: quiz.script,
  };
}

async function saveEarnedRewardEvent(
  request: RewardedAdCompleteRequest,
  dependencies: RewardedAdCompleteDependencies,
): Promise<void> {
  await dependencies.saveAdRewardEvent({
    userId: request.userId,
    quizDate: request.quizDate,
    purpose: request.purpose,
    userEarnedReward: true,
    earnedAt: dependencies.createTimestamp(),
  });
}
