import test from 'node:test';
import assert from 'node:assert/strict';
import { toPublicTodayQuiz } from '../services/quizPublic.js';
import type { Quiz } from '../domain/models.js';

test('keeps server-only quiz fields out of the public today quiz response', () => {
  const quiz: Quiz = {
    quizDate: '2026-05-28',
    isPublished: true,
    audioStoragePath: 'audio/2026-05-28.mp3',
    choices: [
      { id: 'a', text: 'First choice' },
      { id: 'b', text: 'Second choice' },
    ],
    correctChoiceIds: ['a'],
    script: 'Server-only script',
    promotionAmount: 10,
  };

  const publicQuiz = toPublicTodayQuiz(quiz, 'http://127.0.0.1/audio.mp3');

  assert.deepEqual(publicQuiz, {
    quizDate: '2026-05-28',
    audioUrl: 'http://127.0.0.1/audio.mp3',
    choices: [
      { id: 'a', text: 'First choice' },
      { id: 'b', text: 'Second choice' },
    ],
  });
  assert.equal('correctChoiceIds' in publicQuiz, false);
  assert.equal('script' in publicQuiz, false);
  assert.equal('promotionAmount' in publicQuiz, false);
  assert.equal('audioStoragePath' in publicQuiz, false);
});
