import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyQuizForm, type QuizFormState } from '../types/quiz';
import { validateQuizForm } from './quizValidation';

function validForm(overrides: Partial<QuizFormState> = {}): QuizFormState {
  return {
    ...createEmptyQuizForm('2026-06-22'),
    audioStoragePath: 'quiz-audio/2026-06-22/example.mp3',
    choices: [
      { id: 'choice-a', text: 'A' },
      { id: 'choice-b', text: 'B' },
      { id: 'choice-c', text: 'C' },
      { id: 'choice-d', text: 'D' },
      { id: 'choice-e', text: 'E' },
    ],
    correctChoiceIds: ['choice-a'],
    script: 'Example script.',
    promotionAmount: '5',
    ...overrides,
  };
}

test('rejects forms with no correct choice', () => {
  const errors = validateQuizForm(validForm({ correctChoiceIds: [] }));

  assert.equal(errors.correctChoiceIds, '정답은 1개만 선택하세요.');
});

test('rejects forms with multiple correct choices', () => {
  const errors = validateQuizForm(validForm({ correctChoiceIds: ['choice-a', 'choice-b'] }));

  assert.equal(errors.correctChoiceIds, '정답은 1개만 선택하세요.');
});

test('accepts a single correct choice that exists in choices', () => {
  const errors = validateQuizForm(validForm({ correctChoiceIds: ['choice-a'] }));

  assert.equal(errors.correctChoiceIds, undefined);
});
