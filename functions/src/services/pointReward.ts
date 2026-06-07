import type { RewardGrant, RewardStatus, User, UserProgress } from '../domain/models.js';
import { findRewardGrant, saveRewardGrant } from '../repositories/rewardGrantRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { saveUserProgress } from '../repositories/userProgressRepository.js';
import { createTossPromotionClient } from './tossPromotionClient.js';
import type { PromotionExecutionStatus, TossPromotionClient } from './tossPromotionClient.js';
import { hasTossMtlsConfig } from './tossMtlsConfig.js';

export type PointRewardRequest = {
  userId: string;
  quizDate: string;
  amount: number;
  progress: UserProgress;
};

export type PointRewardResult = {
  rewardStatus: RewardStatus;
};

export type PendingRewardRefreshRequest = {
  progress: UserProgress;
  rewardGrant: RewardGrant;
};

export type PendingRewardRefreshResult = {
  status: Exclude<RewardStatus, 'none'>;
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

export async function refreshPendingRewardStatus(
  request: PendingRewardRefreshRequest,
  dependencies: PointRewardDependencies = defaultDependencies,
): Promise<PendingRewardRefreshResult> {
  if (request.rewardGrant.status !== 'pending') {
    return {
      status: request.rewardGrant.status,
    };
  }

  const user = await dependencies.findUserById(request.rewardGrant.userId);

  if (user == null || dependencies.promotionCode === '') {
    console.error('Pending point reward refresh skipped before Toss request.', {
      userId: request.rewardGrant.userId,
      quizDate: request.rewardGrant.quizDate,
      hasUser: user != null,
      hasPromotionCode: dependencies.promotionCode !== '',
      hasMtlsConfig: hasTossMtlsConfig(),
    });

    return {
      status: request.rewardGrant.status,
    };
  }

  try {
    const executionStatus = await dependencies.promotionClient.getExecutionResult({
      userKey: user.userKey,
      promotionCode: dependencies.promotionCode,
      key: request.rewardGrant.promotionKey,
    });
    const rewardStatus = mapPromotionExecutionStatus(executionStatus);

    if (rewardStatus === request.rewardGrant.status) {
      return {
        status: request.rewardGrant.status,
      };
    }

    await Promise.all([
      dependencies.saveRewardGrant({
        ...request.rewardGrant,
        status: rewardStatus,
      }),
      dependencies.saveUserProgress(createProgressWithRewardStatus(request.progress, rewardStatus)),
    ]);

    return {
      status: rewardStatus,
    };
  } catch (error) {
    console.error('Pending point reward refresh failed.', {
      userId: request.rewardGrant.userId,
      quizDate: request.rewardGrant.quizDate,
      promotionKey: request.rewardGrant.promotionKey,
      hasMtlsConfig: hasTossMtlsConfig(),
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return {
      status: request.rewardGrant.status,
    };
  }
}

async function saveFinalRewardStatus(
  request: PointRewardRequest,
  rewardStatus: Exclude<RewardStatus, 'none'>,
  promotionKey: string,
  dependencies: PointRewardDependencies,
): Promise<PointRewardResult> {
  await dependencies.saveRewardGrant({
    userId: request.userId,
    quizDate: request.quizDate,
    promotionKey,
    amount: request.amount,
    status: rewardStatus,
  });

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
