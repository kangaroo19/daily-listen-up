import test from 'node:test';
import assert from 'node:assert/strict';
import { grantPointReward } from '../services/pointReward.js';
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
    { userId: 'user_1', quizDate: '2026-06-01', amount: 10, progress },
    createDependencies({
      findRewardGrant: async () => ({
        userId: 'user_1',
        quizDate: '2026-06-01',
        promotionKey: 'existing_key',
        amount: 10,
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
    { userId: 'user_1', quizDate: '2026-06-01', amount: 10, progress },
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
    { userId: 'user_1', quizDate: '2026-06-01', amount: 10, progress },
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

test('keeps pending when Toss promotion result is pending', async () => {
  const savedProgress: UserProgress[] = [];
  const result = await grantPointReward(
    { userId: 'user_1', quizDate: '2026-06-01', amount: 10, progress },
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
