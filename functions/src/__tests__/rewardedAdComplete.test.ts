import test from 'node:test';
import assert from 'node:assert/strict';
import { completeRewardedAd, RewardedAdCompleteError } from '../services/rewardedAdComplete.js';
import type { AdRewardEvent, Quiz, UserProgress } from '../domain/models.js';

const quiz: Quiz = {
  quizDate: '2026-06-02',
  isPublished: true,
  audioStoragePath: 'quiz-audio/2026-06-02/sample.mp3',
  choices: [
    { id: 'choice-a', text: 'A' },
    { id: 'choice-b', text: 'B' },
    { id: 'choice-c', text: 'C' },
    { id: 'choice-d', text: 'D' },
    { id: 'choice-e', text: 'E' },
  ],
  correctChoiceIds: ['choice-b'],
  script: 'Rewarded script only.',
  promotionAmount: 5,
};

const wrongProgress: UserProgress = {
  userId: 'user_1',
  quizDate: '2026-06-02',
  progressStatus: 'wrong',
  attemptCount: 1,
  lastSubmittedChoiceIds: ['choice-a'],
  isCorrect: false,
  canViewScript: false,
  rewardStatus: 'none',
  rewardReviewRequired: false,
};

test('records a rewarded ad event and unlocks retry after userEarnedReward', async () => {
  const savedProgress: UserProgress[] = [];
  const savedEvents: AdRewardEvent[] = [];

  const result = await completeRewardedAd(
    {
      userId: 'user_1',
      quizDate: '2026-06-02',
      purpose: 'retry',
      userEarnedReward: true,
    },
    createDependencies({
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
      saveAdRewardEvent: async (event) => {
        savedEvents.push(event);
      },
    }),
  );

  assert.equal(result.progressStatus, 'retry_unlocked');
  assert.equal('script' in result, false);
  assert.equal(savedProgress.at(-1)?.progressStatus, 'retry_unlocked');
  assert.equal(savedProgress.at(-1)?.canViewScript, false);
  assert.equal(savedEvents.at(-1)?.purpose, 'retry');
  assert.equal(savedEvents.at(-1)?.userEarnedReward, true);
});

test('returns script only after rewarded script completion', async () => {
  const savedProgress: UserProgress[] = [];

  const result = await completeRewardedAd(
    {
      userId: 'user_1',
      quizDate: '2026-06-02',
      purpose: 'script',
      userEarnedReward: true,
    },
    createDependencies({
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.equal(result.progressStatus, 'wrong');
  assert.equal(result.script, 'Rewarded script only.');
  assert.equal(savedProgress.at(-1)?.canViewScript, true);
});

test('rejects rewarded ad completion before userEarnedReward', async () => {
  await assert.rejects(
    completeRewardedAd(
      {
        userId: 'user_1',
        quizDate: '2026-06-02',
        purpose: 'retry',
        userEarnedReward: false,
      },
      createDependencies(),
    ),
    (error) => error instanceof RewardedAdCompleteError && error.code === 'reward_not_earned',
  );
});

test('does not record a retry reward when retry is not allowed', async () => {
  let eventCount = 0;

  await assert.rejects(
    completeRewardedAd(
      {
        userId: 'user_1',
        quizDate: '2026-06-02',
        purpose: 'retry',
        userEarnedReward: true,
      },
      createDependencies({
        findUserProgress: async () => ({
          ...wrongProgress,
          progressStatus: 'completed',
          isCorrect: true,
        }),
        saveAdRewardEvent: async () => {
          eventCount += 1;
        },
      }),
    ),
    (error) => error instanceof RewardedAdCompleteError && error.code === 'retry_not_allowed',
  );

  assert.equal(eventCount, 0);
});

test('keeps retry unlocked idempotent instead of accumulating retry count', async () => {
  const savedProgress: UserProgress[] = [];

  const result = await completeRewardedAd(
    {
      userId: 'user_1',
      quizDate: '2026-06-02',
      purpose: 'retry',
      userEarnedReward: true,
    },
    createDependencies({
      findUserProgress: async () => ({
        ...wrongProgress,
        progressStatus: 'retry_unlocked',
      }),
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.equal(result.progressStatus, 'retry_unlocked');
  assert.equal(savedProgress.at(-1)?.progressStatus, 'retry_unlocked');
  assert.equal(savedProgress.at(-1)?.attemptCount, 1);
});

test('script reward does not unlock retry progress', async () => {
  const savedProgress: UserProgress[] = [];

  const result = await completeRewardedAd(
    {
      userId: 'user_1',
      quizDate: '2026-06-02',
      purpose: 'script',
      userEarnedReward: true,
    },
    createDependencies({
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.equal(result.progressStatus, 'wrong');
  assert.equal(savedProgress.at(-1)?.progressStatus, 'wrong');
  assert.equal(savedProgress.at(-1)?.canViewScript, true);
});

test('rejects script reward before the user has a submitted result', async () => {
  await assert.rejects(
    completeRewardedAd(
      {
        userId: 'user_1',
        quizDate: '2026-06-02',
        purpose: 'script',
        userEarnedReward: true,
      },
      createDependencies({
        findUserProgress: async () => ({
          ...wrongProgress,
          progressStatus: 'not_started',
        }),
      }),
    ),
    (error) => error instanceof RewardedAdCompleteError && error.code === 'script_not_allowed',
  );
});

function createDependencies(overrides: Partial<Parameters<typeof completeRewardedAd>[1]> = {}) {
  return {
    findPublishedQuizByDate: async () => quiz,
    findUserProgress: async () => wrongProgress,
    saveUserProgress: async () => undefined,
    saveAdRewardEvent: async () => undefined,
    createTimestamp: () => ({ toDate: () => new Date() }) as FirebaseFirestore.Timestamp,
    ...overrides,
  };
}
