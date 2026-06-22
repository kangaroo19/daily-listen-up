import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonQuizImport } from './jsonQuizImport';

function validJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    quizDate: '2026-06-22',
    audioFileName: 'example.mp3',
    script: 'Example script.',
    choices: [
      { id: 'choice-a', text: 'A' },
      { id: 'choice-b', text: 'B' },
      { id: 'choice-c', text: 'C' },
      { id: 'choice-d', text: 'D' },
      { id: 'choice-e', text: 'E' },
    ],
    correctChoiceIds: ['choice-a'],
    promotionAmount: 5,
    ...overrides,
  });
}

test('rejects JSON imports with no correct choice', () => {
  const result = parseJsonQuizImport(validJson({ correctChoiceIds: [] }), 'example.mp3');

  assert.deepEqual(result, {
    ok: false,
    error: 'correctChoiceIds는 정답 id 1개만 포함해야 합니다.',
  });
});

test('rejects JSON imports with multiple correct choices', () => {
  const result = parseJsonQuizImport(validJson({ correctChoiceIds: ['choice-a', 'choice-b'] }), 'example.mp3');

  assert.deepEqual(result, {
    ok: false,
    error: 'correctChoiceIds는 정답 id 1개만 포함해야 합니다.',
  });
});

test('accepts JSON imports with one correct choice', () => {
  const result = parseJsonQuizImport(validJson({ correctChoiceIds: ['choice-a'] }), 'example.mp3');

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.form.correctChoiceIds, ['choice-a']);
  }
});
