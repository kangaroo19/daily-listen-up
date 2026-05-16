import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createTossLoginRouter } from './tossLogin'
import type { AppSessionResult, UserSessionRepository } from '../auth/userSessionRepository'
import { TossAuthError, type TossAuthClient } from '../auth/tossClient'

function createTestApp(options: {
  tossAuthClient: TossAuthClient
  userSessionRepository: UserSessionRepository
  now?: () => Date
  createSessionToken?: () => string
}) {
  const app = express()
  app.use(express.json())
  app.use('/api/login/toss', createTossLoginRouter(options))
  return app
}

function createSessionResult(overrides: Partial<AppSessionResult> = {}): AppSessionResult {
  return {
    userId: 'user-internal-id',
    sessionToken: 'app-session-token',
    expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    ...overrides,
  }
}

describe('POST /api/login/toss', () => {
  it('rejects a missing authorization code', async () => {
    const response = await request(
      createTestApp({
        tossAuthClient: {
          exchangeAuthorizationCode: vi.fn(),
          fetchUserInfo: vi.fn(),
        },
        userSessionRepository: {
          createSessionForTossUser: vi.fn(),
        },
      }),
    )
      .post('/api/login/toss')
      .send({
        referrer: 'SANDBOX',
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        code: 'invalid_request',
        message: 'authorizationCode is required',
      },
    })
  })

  it('rejects an invalid referrer', async () => {
    const response = await request(
      createTestApp({
        tossAuthClient: {
          exchangeAuthorizationCode: vi.fn(),
          fetchUserInfo: vi.fn(),
        },
        userSessionRepository: {
          createSessionForTossUser: vi.fn(),
        },
      }),
    )
      .post('/api/login/toss')
      .send({
        authorizationCode: 'authorization-code',
        referrer: 'WRONG',
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        code: 'invalid_request',
        message: 'referrer must be DEFAULT or SANDBOX',
      },
    })
  })

  it('logs in a Toss user and returns only app session data', async () => {
    const tossAuthClient: TossAuthClient = {
      exchangeAuthorizationCode: vi.fn().mockResolvedValue({
        tokenType: 'Bearer',
        accessToken: 'toss-access-token',
        refreshToken: 'toss-refresh-token',
        expiresIn: 3599,
        scope: 'user_key',
      }),
      fetchUserInfo: vi.fn().mockResolvedValue({
        userKey: '443731104',
        scope: 'user_key unexpected_scope',
      }),
    }
    const userSessionRepository: UserSessionRepository = {
      createSessionForTossUser: vi.fn().mockResolvedValue(createSessionResult()),
    }

    const response = await request(
      createTestApp({
        tossAuthClient,
        userSessionRepository,
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        createSessionToken: () => 'app-session-token',
      }),
    )
      .post('/api/login/toss')
      .send({
        authorizationCode: 'authorization-code',
        referrer: 'SANDBOX',
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      sessionToken: 'app-session-token',
      expiresAt: '2026-05-16T15:00:00.000Z',
      user: {
        id: 'user-internal-id',
      },
    })
    expect(JSON.stringify(response.body)).not.toContain('toss-access-token')
    expect(JSON.stringify(response.body)).not.toContain('toss-refresh-token')
    expect(JSON.stringify(response.body)).not.toContain('443731104')
    expect(tossAuthClient.exchangeAuthorizationCode).toHaveBeenCalledWith({
      authorizationCode: 'authorization-code',
      referrer: 'SANDBOX',
    })
    expect(tossAuthClient.fetchUserInfo).toHaveBeenCalledWith('toss-access-token')
    expect(userSessionRepository.createSessionForTossUser).toHaveBeenCalledWith({
      userKey: '443731104',
      now: new Date('2026-05-16T03:00:00.000Z'),
      sessionToken: 'app-session-token',
      expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    })
  })

  it('maps invalid_grant failures to a login retry response', async () => {
    const response = await request(
      createTestApp({
        tossAuthClient: {
          exchangeAuthorizationCode: vi
            .fn()
            .mockRejectedValue(new TossAuthError('invalid_grant', 'invalid grant')),
          fetchUserInfo: vi.fn(),
        },
        userSessionRepository: {
          createSessionForTossUser: vi.fn(),
        },
      }),
    )
      .post('/api/login/toss')
      .send({
        authorizationCode: 'expired-code',
        referrer: 'DEFAULT',
      })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'login_retry_required',
        message: 'Toss login could not be completed. Please try again.',
      },
    })
  })

  it('maps Toss user lookup failures to a user identification response', async () => {
    const response = await request(
      createTestApp({
        tossAuthClient: {
          exchangeAuthorizationCode: vi.fn().mockResolvedValue({
            tokenType: 'Bearer',
            accessToken: 'toss-access-token',
            refreshToken: 'toss-refresh-token',
            expiresIn: 3599,
            scope: 'user_key',
          }),
          fetchUserInfo: vi
            .fn()
            .mockRejectedValue(new TossAuthError('USER_NOT_FOUND', 'user not found')),
        },
        userSessionRepository: {
          createSessionForTossUser: vi.fn(),
        },
      }),
    )
      .post('/api/login/toss')
      .send({
        authorizationCode: 'authorization-code',
        referrer: 'DEFAULT',
      })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'user_identification_failed',
        message: 'Toss user could not be identified.',
      },
    })
  })
})
