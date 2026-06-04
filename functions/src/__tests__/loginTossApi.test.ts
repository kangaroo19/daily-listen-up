import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoginFailureBody } from '../api/loginToss.js';

test('includes sanitized login failure reason only for sandbox requests', () => {
  assert.deepEqual(createLoginFailureBody('SANDBOX', 'invalid_grant'), {
    code: 'login_failed',
    reason: 'invalid_grant',
  });
  assert.deepEqual(createLoginFailureBody('DEFAULT', 'invalid_grant'), {
    code: 'login_failed',
  });
});
