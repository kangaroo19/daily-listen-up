import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'

import { InMemoryUserSessionRepository } from './userSessionRepository'

describe('InMemoryUserSessionRepository', () => {
  it('creates a user and app session for a new Toss user key', async () => {
    const repository = new InMemoryUserSessionRepository()

    const result = await repository.createSessionForTossUser({
      userKey: '443731104',
      now: new Date('2026-05-16T03:00:00.000Z'),
      sessionToken: 'session-token',
      expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    })

    expect(result.userId).toMatch(/^user_/)
    expect(result.sessionToken).toBe('session-token')
    expect(result.expiresAt.toISOString()).toBe('2026-05-16T15:00:00.000Z')
    expect(repository.users).toHaveLength(1)
    expect(repository.sessions).toHaveLength(1)
    expect(repository.sessions[0]).toMatchObject({
      userId: result.userId,
      expiresAt: Timestamp.fromDate(new Date('2026-05-16T15:00:00.000Z')),
      createdAt: Timestamp.fromDate(new Date('2026-05-16T03:00:00.000Z')),
    })
  })

  it('reuses an existing user and updates last login time', async () => {
    const repository = new InMemoryUserSessionRepository()

    const first = await repository.createSessionForTossUser({
      userKey: '443731104',
      now: new Date('2026-05-16T03:00:00.000Z'),
      sessionToken: 'first-session-token',
      expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    })
    const second = await repository.createSessionForTossUser({
      userKey: '443731104',
      now: new Date('2026-05-16T04:00:00.000Z'),
      sessionToken: 'second-session-token',
      expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    })

    expect(second.userId).toBe(first.userId)
    expect(repository.users).toHaveLength(1)
    expect(repository.users[0]?.createdAt).toEqual(
      Timestamp.fromDate(new Date('2026-05-16T03:00:00.000Z')),
    )
    expect(repository.users[0]?.lastLoginAt).toEqual(
      Timestamp.fromDate(new Date('2026-05-16T04:00:00.000Z')),
    )
    expect(repository.sessions).toHaveLength(2)
  })
})
