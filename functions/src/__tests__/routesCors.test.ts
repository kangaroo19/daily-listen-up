import assert from 'node:assert/strict';
import test from 'node:test';
import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { routeApi } from '../api/routes.js';

test('responds to CORS preflight requests before route matching', async () => {
  const res = createMockResponse();

  await routeApi({ method: 'OPTIONS', path: '/api/login/toss' } as Request, res as unknown as Response);

  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.equal(res.headers['access-control-allow-methods'], 'GET,POST,OPTIONS');
  assert.equal(res.headers['access-control-allow-headers'], 'authorization,content-type');
  assert.equal(res.body, '');
});

test('adds CORS headers to JSON responses', async () => {
  const res = createMockResponse();

  await routeApi({ method: 'GET', path: '/missing' } as Request, res as unknown as Response);

  assert.equal(res.statusCode, 404);
  assert.equal(res.headers['access-control-allow-origin'], '*');
});

function createMockResponse(): {
  statusCode?: number;
  headers: Record<string, string>;
  body?: string;
  status: (statusCode: number) => unknown;
  set: (name: string, value: string) => unknown;
  send: (body: string) => unknown;
  end: () => unknown;
} {
  const response = {
    statusCode: undefined as number | undefined,
    headers: {} as Record<string, string>,
    body: undefined as string | undefined,
    status(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    set(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    send(body: string) {
      this.body = body;
      return this;
    },
    end() {
      this.body = '';
      return this;
    },
  };

  return response;
}
