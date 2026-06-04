import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioUrl } from '../services/storageBoundary.js';

test('creates an audio proxy URL without exposing the original Storage path', async () => {
  const audioUrl = await createAudioUrl({
    quizDate: '2026-05-31',
    requestBaseUrl: 'http://127.0.0.1:5001/daily-listen-up/asia-northeast3/api/api',
  });

  assert.equal(
    audioUrl,
    'http://127.0.0.1:5001/daily-listen-up/asia-northeast3/api/api/quiz-audio?quizDate=2026-05-31',
  );
  assert.equal(audioUrl.includes('quiz-audio/2026-05-31/sample.mp3'), false);
});
