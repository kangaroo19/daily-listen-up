import assert from 'node:assert/strict';
import test from 'node:test';
import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { createHandleTtsPreview } from '../api/ttsPreview.js';

test('rejects requests without an auth token', async () => {
  const res = createMockResponse();
  const handler = createHandleTtsPreview();

  await handler(createMockRequest({ authorization: '' }), res as unknown as Response);

  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(String(res.body)).code, 'missing_auth_token');
});

test('rejects non-admin uid', async () => {
  const res = createMockResponse();
  const handler = createHandleTtsPreview({
    verifyIdToken: async () => ({ uid: 'user-1' }),
    env: { ADMIN_UID_ALLOWLIST: 'admin-1' },
  });

  await handler(createMockRequest({ authorization: 'Bearer token' }), res as unknown as Response);

  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(String(res.body)).code, 'admin_forbidden');
});

test('rejects invalid speaker gender', async () => {
  const res = createMockResponse();
  const handler = createHandleTtsPreview({
    verifyIdToken: async () => ({ uid: 'admin-1' }),
    env: { ADMIN_UID_ALLOWLIST: 'admin-1' },
  });

  await handler(
    createMockRequest({
      authorization: 'Bearer token',
      body: { script: 'hello', speakerGender: 'unknown' },
    }),
    res as unknown as Response,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(String(res.body)).code, 'invalid_speaker_gender');
});

test('returns mp3 blob from ElevenLabs response', async () => {
  const res = createMockResponse();
  const handler = createHandleTtsPreview({
    verifyIdToken: async () => ({ uid: 'admin-1' }),
    env: {
      ADMIN_UID_ALLOWLIST: 'admin-1',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_VOICE_ID_FEMALE: 'female-voice',
    },
    fetchImpl: async (url, init) => {
      assert.equal(url, 'https://api.elevenlabs.io/v1/text-to-speech/female-voice');
      assert.equal(init?.method, 'POST');
      return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    },
  });

  await handler(
    createMockRequest({
      authorization: 'Bearer token',
      body: { script: 'hello', speakerGender: 'female' },
    }),
    res as unknown as Response,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'audio/mpeg');
  assert.deepEqual(res.body, Buffer.from([1, 2, 3]));
});

function createMockRequest({
  authorization,
  body = { script: 'hello', speakerGender: 'female' },
}: {
  authorization: string;
  body?: unknown;
}): Request {
  return {
    method: 'POST',
    body,
    get(name: string) {
      return name.toLowerCase() === 'authorization' ? authorization : undefined;
    },
  } as unknown as Request;
}

function createMockResponse(): {
  statusCode?: number;
  headers: Record<string, string>;
  body?: unknown;
  status: (statusCode: number) => unknown;
  set: (name: string, value: string) => unknown;
  send: (body: unknown) => unknown;
} {
  const response = {
    statusCode: undefined as number | undefined,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    set(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
  };

  return response;
}
