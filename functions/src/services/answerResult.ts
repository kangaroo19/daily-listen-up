import type { ProgressStatus, Quiz, RewardStatus, UserProgress } from '../domain/models.js';
import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { findUserProgress, saveUserProgress } from '../repositories/userProgressRepository.js';
import { grantPointReward } from './pointReward.js';
import { requireAppSession } from './sessionBoundary.js';
import type { AppSessionContext } from './sessionBoundary.js';
import type { PointRewardResult } from './pointReward.js';

export type AnswerResultRequest = {
  token: string;
  quizDate: string;
  selectedChoiceIds: string[];
};

export type AnswerResultResponse = {
  isCorrect: boolean;
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
};

export type AnswerResultDependencies = {
  requireAppSession(token: string): Promise<AppSessionContext>;
  findPublishedQuizByDate(quizDate: string): Promise<Quiz | null>;
  findUserProgress(userId: string, quizDate: string): Promise<UserProgress | null>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  grantPointReward(request: {
    userId: string;
    quizDate: string;
    amount: number;
    progress: UserProgress;
  }): Promise<PointRewardResult>;
};

const defaultDependencies: AnswerResultDependencies = {
  requireAppSession,
  findPublishedQuizByDate,
  findUserProgress,
  saveUserProgress,
  grantPointReward,
};

export class AnswerResultError extends Error {
  constructor(
    message: string,
    public readonly code: 'quiz_not_found' | 'submission_not_allowed',
  ) {
    super(message);
  }
}

export async function submitAnswerResult(
  request: AnswerResultRequest,
  dependencies: AnswerResultDependencies = defaultDependencies,
): Promise<AnswerResultResponse> {
  const session = await dependencies.requireAppSession(request.token);
  const quiz = await dependencies.findPublishedQuizByDate(request.quizDate);

  if (quiz == null) {
    throw new AnswerResultError('Published quiz not found.', 'quiz_not_found');
  }

  const currentProgress = await dependencies.findUserProgress(session.userId, request.quizDate);
  const currentStatus = currentProgress?.progressStatus ?? 'not_started';

  if (currentStatus !== 'not_started' && currentStatus !== 'retry_unlocked') {
    throw new AnswerResultError('Answer submission is not allowed.', 'submission_not_allowed');
  }

  const isCorrect = hasExactChoiceMatch(request.selectedChoiceIds, quiz.correctChoiceIds);
  const nextProgressStatus: ProgressStatus = isCorrect ? 'completed' : 'wrong';
  let nextRewardStatus: RewardStatus = 'none';
  const nextProgress: UserProgress = {
    userId: session.userId,
    quizDate: request.quizDate,
    progressStatus: nextProgressStatus,
    attemptCount: (currentProgress?.attemptCount ?? 0) + 1,
    lastSubmittedChoiceIds: request.selectedChoiceIds,
    isCorrect,
    canViewScript: currentProgress?.canViewScript ?? false,
    rewardStatus: nextRewardStatus,
    rewardReviewRequired: false,
  };

  await dependencies.saveUserProgress(nextProgress);

  if (isCorrect) {
    const rewardResult = await dependencies.grantPointReward({
      userId: session.userId,
      quizDate: request.quizDate,
      amount: quiz.promotionAmount,
      progress: nextProgress,
    });
    nextRewardStatus = rewardResult.rewardStatus;
  }

  return {
    isCorrect,
    progressStatus: nextProgress.progressStatus,
    rewardStatus: nextRewardStatus,
  };
}

function hasExactChoiceMatch(selectedChoiceIds: string[], correctChoiceIds: string[]): boolean {
  if (selectedChoiceIds.length !== correctChoiceIds.length) {
    return false;
  }

  const selected = new Set(selectedChoiceIds);

  if (selected.size !== selectedChoiceIds.length) {
    return false;
  }

  return correctChoiceIds.every((choiceId) => selected.has(choiceId));
}
