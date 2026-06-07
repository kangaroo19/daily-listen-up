import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRewardStatus } from '../services/homeEntry.js';
import type { RewardGrant, UserProgress } from '../domain/models.js';

const baseProgress: UserProgress = {
  userId: 'user_1',
  quizDate: '2026-05-31',
  progressStatus: 'completed',
  attemptCount: 1,
  lastSubmittedChoiceIds: ['choice-a'],
  isCorrect: true,
  canViewScript: false,
  rewardStatus: 'pending',
  rewardReviewRequired: false,
};

test('returns not_started and none when the user has no progress for today', () => {
  assert.deepEqual(resolveRewardStatus(null, null, '2026-05-31'), {
    quizDate: '2026-05-31',
    progressStatus: 'not_started',
    rewardStatus: 'none',
  });
});

test('uses stored progress reward status when no reward grant exists', () => {
  assert.deepEqual(resolveRewardStatus(baseProgress, null, '2026-05-31'), {
    quizDate: '2026-05-31',
    progressStatus: 'completed',
    rewardStatus: 'pending',
  });
});

test('uses reward grant status when a reward grant exists', () => {
  const rewardGrant: RewardGrant = {
    userId: 'user_1',
    quizDate: '2026-05-31',
    promotionKey: 'promotion_1',
    amount: 5,
    status: 'failed',
  };

  assert.deepEqual(resolveRewardStatus(baseProgress, rewardGrant, '2026-05-31'), {
    quizDate: '2026-05-31',
    progressStatus: 'completed',
    rewardStatus: 'failed',
  });
});
