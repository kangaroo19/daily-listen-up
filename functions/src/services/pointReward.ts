import type { RewardGrant, RewardStatus, User, UserProgress } from '../domain/models.js';
import { findRewardGrant, saveRewardGrant } from '../repositories/rewardGrantRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { saveUserProgress } from '../repositories/userProgressRepository.js';
import { createTossPromotionClient } from './tossPromotionClient.js';
import type { PromotionExecutionStatus, TossPromotionClient } from './tossPromotionClient.js';

export type PointRewardRequest = {
  userId: string;
  quizDate: string;
  amount: number;
  progress: UserProgress;
};

export type PointRewardResult = {
  rewardStatus: RewardStatus;
};

export type PointRewardDependencies = {
  findRewardGrant(userId: string, quizDate: string): Promise<RewardGrant | null>;
  saveRewardGrant(rewardGrant: RewardGrant): Promise<void>;
  findUserById(userId: string): Promise<User | null>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  promotionCode: string;
  promotionClient: TossPromotionClient;
};

const defaultDependencies: PointRewardDependencies = {
  findRewardGrant,
  saveRewardGrant,
  findUserById,
  saveUserProgress,
  promotionCode: process.env.TOSS_PROMOTION_CODE ?? '',
  promotionClient: createTossPromotionClient(),
};

export async function grantPointReward(
  request: PointRewardRequest,
  dependencies: PointRewardDependencies = defaultDependencies,
): Promise<PointRewardResult> {
  const existingGrant = await dependencies.findRewardGrant(request.userId, request.quizDate);

  if (existingGrant != null) {
    await dependencies.saveUserProgress(createProgressWithRewardStatus(request.progress, existingGrant.status));

    return {
      rewardStatus: existingGrant.status,
    };
  }

  const user = await dependencies.findUserById(request.userId);

  if (user == null || dependencies.promotionCode === '') {
    return saveFinalRewardStatus(request, 'failed', '', dependencies);
  }

  let promotionKey = '';

  try {
    promotionKey = await dependencies.promotionClient.createPromotionKey(user.userKey);
    const pendingGrant: RewardGrant = {
      userId: request.userId,
      quizDate: request.quizDate,
      promotionKey,
      amount: request.amount,
      status: 'pending',
    };

    await Promise.all([
      dependencies.saveRewardGrant(pendingGrant),
      dependencies.saveUserProgress(createProgressWithRewardStatus(request.progress, 'pending')),
    ]);

    await dependencies.promotionClient.executePromotion({
      userKey: user.userKey,
      promotionCode: dependencies.promotionCode,
      key: promotionKey,
      amount: request.amount,
    });

    const executionStatus = await dependencies.promotionClient.getExecutionResult({
      userKey: user.userKey,
      promotionCode: dependencies.promotionCode,
      key: promotionKey,
    });

    return saveFinalRewardStatus(request, mapPromotionExecutionStatus(executionStatus), promotionKey, dependencies);
  } catch {
    return saveFinalRewardStatus(request, 'failed', promotionKey, dependencies);
  }
}

async function saveFinalRewardStatus(
  request: PointRewardRequest,
  rewardStatus: Exclude<RewardStatus, 'none'>,
  promotionKey: string,
  dependencies: PointRewardDependencies,
): Promise<PointRewardResult> {
  if (promotionKey !== '') {
    await dependencies.saveRewardGrant({
      userId: request.userId,
      quizDate: request.quizDate,
      promotionKey,
      amount: request.amount,
      status: rewardStatus,
    });
  }

  await dependencies.saveUserProgress(createProgressWithRewardStatus(request.progress, rewardStatus));

  return {
    rewardStatus,
  };
}

function createProgressWithRewardStatus(
  progress: UserProgress,
  rewardStatus: Exclude<RewardStatus, 'none'>,
): UserProgress {
  return {
    ...progress,
    rewardStatus,
    rewardReviewRequired: rewardStatus === 'failed',
  };
}

function mapPromotionExecutionStatus(status: PromotionExecutionStatus): Exclude<RewardStatus, 'none'> {
  if (status === 'SUCCESS') {
    return 'success';
  }

  if (status === 'FAILED') {
    return 'failed';
  }

  return 'pending';
}
