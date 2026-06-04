import assert from 'node:assert/strict';
import test from 'node:test';
import { createTossLoginClient } from '../services/tossLoginClient.js';

test('preserves Toss top-level OAuth error messages', async () => {
  const client = createTossLoginClient(
    async () =>
      new Response(JSON.stringify({ error: 'invalid_grant' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }),
    'https://apps-in-toss-api.toss.im',
    undefined,
  );

  await assert.rejects(
    () =>
      client.generateToken({
        authorizationCode: 'expired-or-reused-code',
        referrer: 'SANDBOX',
      }),
    /invalid_grant/,
  );
});
