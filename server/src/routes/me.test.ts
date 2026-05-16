import express from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createMeRouter } from './me'
import type { CurrentSessionRepository } from '../auth/userSessionRepository'

function createTestApp(options: {
  sessionRepository: CurrentSessionRepository
  now?: () => Date
}) {
  const app = express()
  app.use(express.json())
  app.use('/api/me', createMeRouter(options))
  return app
}

function createRepository(
  overrides: Partial<CurrentSessionRepository> = {},
): CurrentSessionRepository {
  return {
    findSessionByToken: vi.fn(),
    findUserById: vi.fn(),
    findUserProgress: vi.fn(),
    ...overrides,
  }
}

describe('GET /api/me', () => {
  it('rejects a missing authorization header', async () => {
    const response = await request(
      createTestApp({
        sessionRepository: createRepository(),
      }),
    ).get('/api/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    })
  })

  it('rejects a non-Bearer authorization header', async () => {
    const response = await request(
      createTestApp({
        sessionRepository: createRepository(),
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Basic app-session-token')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    })
  })

  it('rejects an unknown app session token', async () => {
    const sessionRepository = createRepository({
      findSessionByToken: vi.fn().mockResolvedValue(null),
    })

    const response = await request(
      createTestApp({
        sessionRepository,
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer missing-session-token')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    })
    expect(sessionRepository.findSessionByToken).toHaveBeenCalledWith(
      'missing-session-token',
    )
  })

  it('rejects an expired app session', async () => {
    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createRepository({
          findSessionByToken: vi.fn().mockResolvedValue({
            userId: 'user-internal-id',
            expiresAt: new Date('2026-05-16T02:59:59.999Z'),
          }),
        }),
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer expired-session-token')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    })
  })

  it('returns the current user and null progress when today has no userProgress document', async () => {
    const sessionRepository = createRepository({
      findSessionByToken: vi.fn().mockResolvedValue({
        userId: 'user-internal-id',
        expiresAt: new Date('2026-05-16T15:00:00.000Z'),
      }),
      findUserById: vi.fn().mockResolvedValue({
        id: 'user-internal-id',
        userKey: '443731104',
        createdAt: Timestamp.fromDate(new Date('2026-05-16T01:00:00.000Z')),
        lastLoginAt: Timestamp.fromDate(new Date('2026-05-16T02:00:00.000Z')),
      }),
      findUserProgress: vi.fn().mockResolvedValue(null),
    })

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-15T15:30:00.000Z'),
        sessionRepository,
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: {
        id: 'user-internal-id',
      },
      session: {
        expiresAt: '2026-05-16T15:00:00.000Z',
      },
      today: {
        quizDate: '2026-05-16',
        progress: null,
      },
    })
    expect(sessionRepository.findUserProgress).toHaveBeenCalledWith({
      userId: 'user-internal-id',
      quizDate: '2026-05-16',
    })
  })

  it('returns only public fields from today userProgress', async () => {
    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createRepository({
          findSessionByToken: vi.fn().mockResolvedValue({
            userId: 'user-internal-id',
            expiresAt: new Date('2026-05-16T15:00:00.000Z'),
          }),
          findUserById: vi.fn().mockResolvedValue({
            id: 'user-internal-id',
            userKey: '443731104',
            createdAt: Timestamp.fromDate(new Date('2026-05-16T01:00:00.000Z')),
            lastLoginAt: Timestamp.fromDate(
              new Date('2026-05-16T02:00:00.000Z'),
            ),
          }),
          findUserProgress: vi.fn().mockResolvedValue({
            userId: 'user-internal-id',
            quizDate: '2026-05-16',
            attemptCount: 1,
            lastSubmittedChoiceIds: ['choice-a'],
            isCorrect: false,
            canRetry: false,
            canViewScript: false,
            rewardStatus: 'none',
            needsRewardReview: false,
            updatedAt: Timestamp.fromDate(new Date('2026-05-16T03:00:00.000Z')),
          }),
        }),
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body.today.progress).toEqual({
      attemptCount: 1,
      lastSubmittedChoiceIds: ['choice-a'],
      isCorrect: false,
      canRetry: false,
      canViewScript: false,
      rewardStatus: 'none',
      needsRewardReview: false,
    })
    expect(JSON.stringify(response.body)).not.toContain('443731104')
    expect(JSON.stringify(response.body)).not.toContain('toss-access-token')
    expect(JSON.stringify(response.body)).not.toContain('toss-refresh-token')
  })

  it('returns null progress when only another date has userProgress', async () => {
    const sessionRepository = createRepository({
      findSessionByToken: vi.fn().mockResolvedValue({
        userId: 'user-internal-id',
        expiresAt: new Date('2026-05-16T15:00:00.000Z'),
      }),
      findUserById: vi.fn().mockResolvedValue({
        id: 'user-internal-id',
        userKey: '443731104',
        createdAt: Timestamp.fromDate(new Date('2026-05-16T01:00:00.000Z')),
        lastLoginAt: Timestamp.fromDate(new Date('2026-05-16T02:00:00.000Z')),
      }),
      findUserProgress: vi.fn().mockImplementation(({ quizDate }) =>
        quizDate === '2026-05-15'
          ? {
              userId: 'user-internal-id',
              quizDate: '2026-05-15',
              attemptCount: 1,
              lastSubmittedChoiceIds: ['choice-a'],
              isCorrect: true,
              canRetry: false,
              canViewScript: true,
              rewardStatus: 'success',
              needsRewardReview: false,
              updatedAt: Timestamp.fromDate(
                new Date('2026-05-15T03:00:00.000Z'),
              ),
            }
          : null,
      ),
    })

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository,
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body.today).toEqual({
      quizDate: '2026-05-16',
      progress: null,
    })
  })

  it('returns a server error when a valid session points to a missing user', async () => {
    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createRepository({
          findSessionByToken: vi.fn().mockResolvedValue({
            userId: 'missing-user-id',
            expiresAt: new Date('2026-05-16T15:00:00.000Z'),
          }),
          findUserById: vi.fn().mockResolvedValue(null),
        }),
      }),
    )
      .get('/api/me')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: {
        code: 'session_user_not_found',
        message: 'Session user could not be loaded.',
      },
    })
  })
})
