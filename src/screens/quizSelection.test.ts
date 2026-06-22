import test from 'node:test';
import assert from 'node:assert/strict';
import { selectSingleChoiceId } from './quizSelection';

test('selects one choice when no choice is selected', () => {
  assert.deepEqual(selectSingleChoiceId([], 'choice-a'), ['choice-a']);
});

test('replaces the selected choice when another choice is selected', () => {
  assert.deepEqual(selectSingleChoiceId(['choice-a'], 'choice-b'), ['choice-b']);
});

test('keeps the selected choice when the same choice is selected again', () => {
  assert.deepEqual(selectSingleChoiceId(['choice-a'], 'choice-a'), ['choice-a']);
});
