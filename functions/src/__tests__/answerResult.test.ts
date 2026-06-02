import test from 'node:test';
import assert from 'node:assert/strict';
import { submitAnswerResult } from '../services/answerResult.js';
import type { AnswerResultDependencies } from '../services/answerResult.js';
import type { Quiz, UserProgress } from '../domain/models.js';

const quiz: Quiz = {
  quizDate: '2026-05-31',
  isPublished: true,
  audioStoragePath: 'quiz-audio/2026-05-31/sample.mp3',
  choices: [
    { id: 'choice-a', text: 'A' },
    { id: 'choice-b', text: 'B' },
    { id: 'choice-c', text: 'C' },
    { id: 'choice-d', text: 'D' },
    { id: 'choice-e', text: 'E' },
  ],
  correctChoiceIds: ['choice-b', 'choice-e'],
  script: 'Server only.',
  promotionAmount: 5,
};

test('accepts a first correct answer and stores completed progress', async () => {
  const savedProgress: UserProgress[] = [];
  const result = await submitAnswerResult(
    {
      token: 'app_session_token',
      quizDate: '2026-05-31',
      selectedChoiceIds: ['choice-e', 'choice-b'],
    },
    createDependencies({
      findUserProgress: async () => null,
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.deepEqual(result, {
    isCorrect: true,
    progressStatus: 'completed',
    rewardStatus: 'none',
  });
  assert.equal(savedProgress.length, 1);
  assert.deepEqual(savedProgress[0], {
    userId: 'user_1',
    quizDate: '2026-05-31',
    progressStatus: 'completed',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-e', 'choice-b'],
    isCorrect: true,
    canViewScript: false,
    rewardStatus: 'none',
    rewardReviewRequired: false,
  });
});

test('returns latest reward status after a correct answer enters the point reward flow', async () => {
  const result = await submitAnswerResult(
    {
      token: 'app_session_token',
      quizDate: '2026-05-31',
      selectedChoiceIds: ['choice-e', 'choice-b'],
    },
    createDependencies({
      findUserProgress: async () => null,
      grantPointReward: async () => ({ rewardStatus: 'success' }),
    }),
  );

  assert.deepEqual(result, {
    isCorrect: true,
    progressStatus: 'completed',
    rewardStatus: 'success',
  });
});

test('stores wrong progress when selected choices do not exactly match', async () => {
  const savedProgress: UserProgress[] = [];
  const result = await submitAnswerResult(
    {
      token: 'app_session_token',
      quizDate: '2026-05-31',
      selectedChoiceIds: ['choice-b'],
    },
    createDependencies({
      findUserProgress: async () => null,
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.deepEqual(result, {
    isCorrect: false,
    progressStatus: 'wrong',
    rewardStatus: 'none',
  });
  assert.equal(savedProgress[0].progressStatus, 'wrong');
  assert.equal(savedProgress[0].rewardStatus, 'none');
  assert.equal(savedProgress[0].attemptCount, 1);
});

test('allows retry_unlocked submission and consumes the retry state', async () => {
  const savedProgress: UserProgress[] = [];
  const result = await submitAnswerResult(
    {
      token: 'app_session_token',
      quizDate: '2026-05-31',
      selectedChoiceIds: ['choice-a'],
    },
    createDependencies({
      findUserProgress: async () => ({
        ...baseProgress,
        progressStatus: 'retry_unlocked',
        attemptCount: 1,
      }),
      saveUserProgress: async (progress) => {
        savedProgress.push(progress);
      },
    }),
  );

  assert.equal(result.isCorrect, false);
  assert.equal(result.progressStatus, 'wrong');
  assert.equal(savedProgress[0].progressStatus, 'wrong');
  assert.equal(savedProgress[0].attemptCount, 2);
});

test('rejects wrong and completed statuses', async () => {
  await assert.rejects(
    () =>
      submitAnswerResult(
        {
          token: 'app_session_token',
          quizDate: '2026-05-31',
          selectedChoiceIds: ['choice-b', 'choice-e'],
        },
        createDependencies({
          findUserProgress: async () => ({
            ...baseProgress,
            progressStatus: 'wrong',
          }),
        }),
      ),
    /Answer submission is not allowed/,
  );

  await assert.rejects(
    () =>
      submitAnswerResult(
        {
          token: 'app_session_token',
          quizDate: '2026-05-31',
          selectedChoiceIds: ['choice-b', 'choice-e'],
        },
        createDependencies({
          findUserProgress: async () => ({
            ...baseProgress,
            progressStatus: 'completed',
          }),
        }),
      ),
    /Answer submission is not allowed/,
  );
});

const baseProgress: UserProgress = {
  userId: 'user_1',
  quizDate: '2026-05-31',
  progressStatus: 'wrong',
  attemptCount: 1,
  lastSubmittedChoiceIds: ['choice-a'],
  isCorrect: false,
  canViewScript: false,
  rewardStatus: 'none',
  rewardReviewRequired: false,
};

function createDependencies(overrides: Partial<AnswerResultDependencies> = {}): AnswerResultDependencies {
  return {
    requireAppSession: async () => ({ sessionTokenId: 'session_1', userId: 'user_1' }),
    findPublishedQuizByDate: async () => quiz,
    findUserProgress: async () => null,
    saveUserProgress: async () => undefined,
    grantPointReward: async () => ({ rewardStatus: 'none' }),
    ...overrides,
  };
}
