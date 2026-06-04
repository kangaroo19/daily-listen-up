import test from 'node:test';
import assert from 'node:assert/strict';
import { TOSS_RELEASE_SECRET_NAMES } from '../releaseSecrets.js';

test('uses consistent Firebase Secret Manager names for Toss release configuration', () => {
  assert.deepEqual(TOSS_RELEASE_SECRET_NAMES, [
    'TOSS_PROMOTION_CODE',
    'TOSS_MTLS_CERT',
    'TOSS_MTLS_KEY',
  ]);
});
