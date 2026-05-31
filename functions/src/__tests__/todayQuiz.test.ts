import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicTodayQuiz } from '../services/todayQuiz.js';
import type { Quiz } from '../domain/models.js';
import type { TodayQuizDependencies } from '../services/todayQuiz.js';

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
  correctChoiceIds: ['choice-a'],
  script: 'Server only.',
  promotionAmount: 10,
};

test('loads today public quiz after validating the app session', async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    requireAppSession: async (token) => {
      calls.push(`session:${token}`);
      return { sessionTokenId: 'session_1', userId: 'user_1' };
    },
    createAudioUrl: async ({ quizDate, requestBaseUrl }) => {
      calls.push(`audio:${quizDate}:${requestBaseUrl}`);
      return 'http://127.0.0.1:5001/project/region/api/api/quiz-audio?quizDate=2026-05-31';
    },
  });

  const publicQuiz = await getPublicTodayQuiz('app_session_token', 'http://127.0.0.1:5001/project/region/api/api', dependencies);

  assert.deepEqual(calls, ['session:app_session_token', 'audio:2026-05-31:http://127.0.0.1:5001/project/region/api/api']);
  assert.deepEqual(publicQuiz, {
    quizDate: '2026-05-31',
    audioUrl: 'http://127.0.0.1:5001/project/region/api/api/quiz-audio?quizDate=2026-05-31',
    choices: [
      { id: 'choice-a', text: 'A' },
      { id: 'choice-b', text: 'B' },
      { id: 'choice-c', text: 'C' },
      { id: 'choice-d', text: 'D' },
      { id: 'choice-e', text: 'E' },
    ],
  });
  assert.equal(publicQuiz == null ? false : 'correctChoiceIds' in publicQuiz, false);
  assert.equal(publicQuiz == null ? false : 'script' in publicQuiz, false);
  assert.equal(publicQuiz == null ? false : 'promotionAmount' in publicQuiz, false);
  assert.equal(publicQuiz == null ? false : 'audioStoragePath' in publicQuiz, false);
  assert.equal(publicQuiz?.audioUrl.includes(quiz.audioStoragePath), false);
});

test('returns null when today has no published quiz', async () => {
  const dependencies = createDependencies({
    findPublishedQuizByDate: async () => null,
  });

  await assert.doesNotReject(async () => {
    assert.equal(await getPublicTodayQuiz('app_session_token', 'http://127.0.0.1:5001/project/region/api/api', dependencies), null);
  });
});

test('does not load quiz content when the app session is invalid', async () => {
  const dependencies = createDependencies({
    requireAppSession: async () => {
      throw new Error('App session expired.');
    },
    findPublishedQuizByDate: async () => {
      throw new Error('Should not query quiz.');
    },
  });

  await assert.rejects(
    () => getPublicTodayQuiz('app_session_token', 'http://127.0.0.1:5001/project/region/api/api', dependencies),
    /App session expired/,
  );
});

function createDependencies(overrides: Partial<TodayQuizDependencies> = {}): TodayQuizDependencies {
  return {
    requireAppSession: async () => ({ sessionTokenId: 'session_1', userId: 'user_1' }),
    getTodayDateString: () => '2026-05-31',
    findPublishedQuizByDate: async () => quiz,
    createAudioUrl: async () => 'http://127.0.0.1/audio.mp3',
    ...overrides,
  };
}
