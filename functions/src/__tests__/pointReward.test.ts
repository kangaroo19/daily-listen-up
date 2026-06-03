import test from 'node:test';
import assert from 'node:assert/strict';
import { grantPointReward, refreshPendingRewardStatus } from '../services/pointReward.js';
import type { PointRewardDependencies } from '../services/pointReward.js';
import type { RewardGrant, User, UserProgress } from '../domain/models.js';

const user: User = {
  userId: 'user_1',
  userKey: 'toss_user_key_1',
  loggedInAt: { toDate: () => new Date() } as FirebaseFirestore.Timestamp,
};

const progress: UserProgress = {
  userId: 'user_1',
  quizDate: '2026-06-01',
  progressStatus: 'completed',
  attemptCount: 1,
  lastSubmittedChoiceIds: ['choice-b'],
  isCorrect: true,
  canViewScript: false,
  rewardStatus: 'none',
  rewardReviewRequired: false,
};

test('returns existing reward status without issuing a duplicate Toss promotion request', async () => {
  let requestCount = 0;
  const savedProgress: UserProgress[] = [];
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 5, progress },
    createDependencies({
      findRewardGrant: async () => ({
        userId: 'user_1',
        quizDate: '2026-06-01',
        promotionKey: 'existing_key',
        amount: 5,
        status: 'success',
      }),
      promotionClient: {
        async createPromotionKey() {
          requestCount += 1;
          return 'new_key';
        },
        async executePromotion() {
          requestCount += 1;
        },
        async getExecutionResult() {
          requestCount += 1;
          return 'SUCCESS';
        },
      },
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
    }),
  );

  assert.equal(result.rewardStatus, 'success');
  assert.equal(requestCount, 0);
  assert.equal(savedProgress[0].rewardStatus, 'success');
});

test('stores pending first, then success when Toss promotion execution succeeds', async () => {
  const savedGrants: RewardGrant[] = [];
  const savedProgress: UserProgress[] = [];
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 5, progress },
    createDependencies({
      saveRewardGrant: async (grant) => {
        savedGrants.push(grant);
      },
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
    }),
  );

  assert.equal(result.rewardStatus, 'success');
  assert.deepEqual(
    savedGrants.map((grant) => grant.status),
    ['pending', 'success'],
  );
  assert.deepEqual(
    savedProgress.map((nextProgress) => nextProgress.rewardStatus),
    ['pending', 'success'],
  );
  assert.equal(savedProgress.at(-1)?.rewardReviewRequired, false);
});

test('stores failed and review required when Toss promotion execution fails', async () => {
  const savedGrants: RewardGrant[] = [];
  const savedProgress: UserProgress[] = [];
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 5, progress },
    createDependencies({
      saveRewardGrant: async (grant) => {
        savedGrants.push(grant);
      },
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
      promotionClient: {
        async createPromotionKey() {
          return 'promotion_key_1';
        },
        async executePromotion() {
          throw new Error('promotion failed');
        },
        async getExecutionResult() {
          return 'FAILED';
        },
      },
    }),
  );

  assert.equal(result.rewardStatus, 'failed');
  assert.equal(savedGrants.at(-1)?.status, 'failed');
  assert.equal(savedProgress.at(-1)?.rewardStatus, 'failed');
  assert.equal(savedProgress.at(-1)?.rewardReviewRequired, true);
});

test('stores a failed reward grant when reward setup cannot issue a Toss request', async () => {
  const savedGrants: RewardGrant[] = [];
  const savedProgress: UserProgress[] = [];
  let requestCount = 0;
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 5, progress },
    createDependencies({
      promotionCode: '',
      saveRewardGrant: async (grant) => {
        savedGrants.push(grant);
      },
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
      promotionClient: {
        async createPromotionKey() {
          requestCount += 1;
          return 'promotion_key_1';
        },
        async executePromotion() {
          requestCount += 1;
        },
        async getExecutionResult() {
          requestCount += 1;
          return 'SUCCESS';
        },
      },
    }),
  );

  assert.equal(result.rewardStatus, 'failed');
  assert.equal(requestCount, 0);
  assert.deepEqual(savedGrants, [
    {
      userId: 'user_1',
      quizDate: '2026-06-01',
      promotionKey: '',
      amount: 5,
      status: 'failed',
    },
  ]);
  assert.equal(savedProgress.at(-1)?.progressStatus, 'completed');
  assert.equal(savedProgress.at(-1)?.rewardStatus, 'failed');
  assert.equal(savedProgress.at(-1)?.rewardReviewRequired, true);
});

test('keeps pending when Toss promotion result is pending', async () => {
  const savedProgress: UserProgress[] = [];
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 5, progress },
    createDependencies({
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
      promotionClient: {
        async createPromotionKey() {
          return 'promotion_key_1';
        },
        async executePromotion() {
          return undefined;
        },
        async getExecutionResult() {
          return 'PENDING';
        },
      },
    }),
  );

  assert.equal(result.rewardStatus, 'pending');
  assert.equal(savedProgress.at(-1)?.rewardStatus, 'pending');
});

test('refreshes pending reward grant status from Toss execution result', async () => {
  const savedGrants: RewardGrant[] = [];
  const savedProgress: UserProgress[] = [];
  const rewardGrant: RewardGrant = {
    userId: 'user_1',
    quizDate: '2026-06-01',
    promotionKey: 'promotion_key_1',
    amount: 5,
    status: 'pending',
  };

  const result = await refreshPendingRewardStatus(
    { progress, rewardGrant },
    createDependencies({
      saveRewardGrant: async (grant) => {
        savedGrants.push(grant);
      },
      saveUserProgress: async (nextProgress) => {
        savedProgress.push(nextProgress);
      },
      promotionClient: {
        async createPromotionKey() {
          throw new Error('createPromotionKey should not be called');
        },
        async executePromotion() {
          throw new Error('executePromotion should not be called');
        },
        async getExecutionResult() {
          return 'SUCCESS';
        },
      },
    }),
  );

  assert.equal(result.status, 'success');
  assert.equal(savedGrants.at(-1)?.status, 'success');
  assert.equal(savedProgress.at(-1)?.rewardStatus, 'success');
  assert.equal(savedProgress.at(-1)?.rewardReviewRequired, false);
});

test('does not refresh a non-pending reward grant', async () => {
  let requestCount = 0;
  const rewardGrant: RewardGrant = {
    userId: 'user_1',
    quizDate: '2026-06-01',
    promotionKey: 'promotion_key_1',
    amount: 5,
    status: 'success',
  };

  const result = await refreshPendingRewardStatus(
    { progress, rewardGrant },
    createDependencies({
      promotionClient: {
        async createPromotionKey() {
          throw new Error('createPromotionKey should not be called');
        },
        async executePromotion() {
          throw new Error('executePromotion should not be called');
        },
        async getExecutionResult() {
          requestCount += 1;
          return 'FAILED';
        },
      },
    }),
  );

  assert.equal(result.status, 'success');
  assert.equal(requestCount, 0);
});

function createDependencies(overrides: Partial<PointRewardDependencies> = {}): PointRewardDependencies {
  return {
    findRewardGrant: async () => null,
    saveRewardGrant: async () => undefined,
    findUserById: async () => user,
    saveUserProgress: async () => undefined,
    promotionCode: 'TEST_PROMOTION_CODE',
    promotionClient: {
      async createPromotionKey() {
        return 'promotion_key_1';
      },
      async executePromotion() {
        return undefined;
      },
      async getExecutionResult() {
        return 'SUCCESS';
      },
    },
    ...overrides,
  };
}
