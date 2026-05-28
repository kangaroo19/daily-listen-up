import test from 'node:test';
import assert from 'node:assert/strict';
import { getKstDateString } from '../utils/kstDate.js';

test('returns the calendar date in KST', () => {
  const utcDate = new Date('2026-05-27T15:30:00.000Z');

  assert.equal(getKstDateString(utcDate), '2026-05-28');
});
