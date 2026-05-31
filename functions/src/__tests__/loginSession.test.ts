import test from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { createLoginSession } from '../services/loginSession.js';
import type { AppSession, User } from '../domain/models.js';

test('exchanges Toss authorization code on the server and returns only an app session token', async () => {
  const savedUsers = new Map<string, User>();
  const savedSessions = new Map<string, AppSession>();
  const calls: string[] = [];

  const result = await createLoginSession(
    {
      authorizationCode: 'auth-code',
      referrer: 'SANDBOX',
      now: new Date('2026-05-28T03:00:00.000Z'),
    },
    {
      tossClient: {
        async generateToken(request) {
          calls.push(`generate:${request.authorizationCode}:${request.referrer}`);
          return {
            accessToken: 'server-access-token',
            refreshToken: 'server-refresh-token',
            expiresIn: 3599,
            scope: 'user_key',
            tokenType: 'Bearer',
          };
        },
        async getLoginMe(accessToken) {
          calls.push(`login-me:${accessToken}`);
          return {
            userKey: '443731104',
            scope: 'user_key',
            agreedTerms: ['terms_tag1'],
          };
        },
      },
      userRepository: {
        async findByUserKey() {
          return null;
        },
        async save(user) {
          savedUsers.set(user.userId, user);
        },
      },
      sessionRepository: {
        async save(tokenId, session) {
          savedSessions.set(tokenId, session);
        },
      },
      createSessionToken: () => 'app-session-token',
      createUserId: () => 'user_internal_1',
      hashSessionToken: (token) => `hashed:${token}`,
    },
  );

  assert.deepEqual(calls, ['generate:auth-code:SANDBOX', 'login-me:server-access-token']);
  assert.equal(result.appSessionToken, 'app-session-token');
  assert.deepEqual(Object.keys(result), ['appSessionToken', 'expiresAt']);
  assert.equal(savedUsers.get('user_internal_1')?.userKey, '443731104');
  assert.equal(savedSessions.get('hashed:app-session-token')?.sessionTokenId, 'hashed:app-session-token');
  assert.equal(savedSessions.get('hashed:app-session-token')?.userId, 'user_internal_1');
  assert.equal(
    savedSessions.get('hashed:app-session-token')?.expiresAt.toDate().toISOString(),
    '2026-05-28T15:00:00.000Z',
  );
});

test('reuses the existing internal user when Toss userKey is already linked', async () => {
  let savedUser = false;

  const result = await createLoginSession(
    {
      authorizationCode: 'auth-code',
      referrer: 'DEFAULT',
      now: new Date('2026-05-28T03:00:00.000Z'),
    },
    {
      tossClient: {
        async generateToken() {
          return {
            accessToken: 'server-access-token',
            refreshToken: 'server-refresh-token',
            expiresIn: 3599,
            scope: 'user_key',
            tokenType: 'Bearer',
          };
        },
        async getLoginMe() {
          return {
            userKey: '443731104',
            scope: 'user_key',
            agreedTerms: [],
          };
        },
      },
      userRepository: {
        async findByUserKey() {
          return {
            userId: 'existing_user',
            userKey: '443731104',
            loggedInAt: Timestamp.fromDate(new Date('2026-05-27T00:00:00.000Z')),
          };
        },
        async save() {
          savedUser = true;
        },
      },
      sessionRepository: {
        async save() {},
      },
      createSessionToken: () => 'app-session-token',
      createUserId: () => 'new_user_should_not_be_used',
      hashSessionToken: (token) => `hashed:${token}`,
    },
  );

  assert.equal(result.appSessionToken, 'app-session-token');
  assert.equal(savedUser, true);
});
