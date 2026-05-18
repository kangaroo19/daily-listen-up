import express from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createTodayQuizRouter } from './todayQuiz'
import type { CurrentSessionRepository } from '../auth/userSessionRepository'
import type {
  QuizDocument,
  UserDocument,
  UserProgressDocument,
} from '../firebase/collections'
import type { AudioUrlSigner } from '../quiz/audioUrlSigner'
import type { TodayQuizRepository } from '../quiz/todayQuizRepository'

function createTestApp(options: {
  sessionRepository: CurrentSessionRepository
  quizRepository: TodayQuizRepository
  audioUrlSigner?: AudioUrlSigner
  now?: () => Date
}) {
  const app = express()
  app.use(express.json())
  app.use('/api/today-quiz', createTodayQuizRouter(options))
  return app
}

function createSessionRepository(
  overrides: Partial<CurrentSessionRepository> = {},
): CurrentSessionRepository {
  return {
    findSessionByToken: vi.fn().mockResolvedValue({
      userId: 'user-internal-id',
      expiresAt: new Date('2026-05-16T15:00:00.000Z'),
    }),
    findUserById: vi.fn().mockResolvedValue(createUser()),
    findUserProgress: vi.fn(),
    ...overrides,
  }
}

function createQuizRepository(
  overrides: Partial<TodayQuizRepository> = {},
): TodayQuizRepository {
  return {
    findPublishedQuizzesByDate: vi.fn().mockResolvedValue([]),
    findUserProgress: vi.fn().mockResolvedValue(null),
    createDefaultUserProgress: vi.fn(),
    ...overrides,
  }
}

function createAudioUrlSigner(
  overrides: Partial<AudioUrlSigner> = {},
): AudioUrlSigner {
  return {
    createReadUrl: vi.fn().mockResolvedValue('https://example.com/audio.mp3'),
    ...overrides,
  }
}

function createUser(): UserDocument & { id: string } {
  return {
    id: 'user-internal-id',
    userKey: '443731104',
    createdAt: Timestamp.fromDate(new Date('2026-05-16T01:00:00.000Z')),
    lastLoginAt: Timestamp.fromDate(new Date('2026-05-16T02:00:00.000Z')),
  }
}

function createQuiz(overrides: Partial<QuizDocument & { id: string }> = {}) {
  return {
    id: 'quiz-1',
    quizDate: '2026-05-16',
    isPublished: true,
    questionText: '정답이라고 생각하는 답을 모두 골라주세요',
    audioStoragePath: 'quizzes/2026-05-16/audio.mp3',
    choices: [
      { id: 'choice-a', text: '첫 번째 선택지' },
      { id: 'choice-b', text: '두 번째 선택지' },
      { id: 'choice-c', text: '세 번째 선택지' },
      { id: 'choice-d', text: '네 번째 선택지' },
      { id: 'choice-e', text: '다섯 번째 선택지' },
    ],
    correctChoiceIds: ['choice-a', 'choice-c'],
    script: 'private script',
    promotionAmount: 10,
    ...overrides,
  }
}

function createProgress(
  overrides: Partial<UserProgressDocument> = {},
): UserProgressDocument {
  return {
    userId: 'user-internal-id',
    quizDate: '2026-05-16',
    attemptCount: 0,
    lastSubmittedChoiceIds: [],
    isCorrect: false,
    canRetry: false,
    canViewScript: false,
    rewardStatus: 'none',
    needsRewardReview: false,
    updatedAt: Timestamp.fromDate(new Date('2026-05-16T03:00:00.000Z')),
    ...overrides,
  }
}

describe('GET /api/today-quiz', () => {
  it('rejects a missing authorization header', async () => {
    const response = await request(
      createTestApp({
        sessionRepository: createSessionRepository(),
        quizRepository: createQuizRepository(),
      }),
    ).get('/api/today-quiz')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    })
  })

  it('rejects an expired app session', async () => {
    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createSessionRepository({
          findSessionByToken: vi.fn().mockResolvedValue({
            userId: 'user-internal-id',
            expiresAt: new Date('2026-05-16T02:59:59.999Z'),
          }),
        }),
        quizRepository: createQuizRepository(),
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer expired-session-token')

    expect(response.status).toBe(401)
  })

  it('returns empty when today has no published quiz', async () => {
    const quizRepository = createQuizRepository()

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-15T15:30:00.000Z'),
        sessionRepository: createSessionRepository(),
        quizRepository,
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'empty',
      quiz: null,
      progress: null,
    })
    expect(quizRepository.findPublishedQuizzesByDate).toHaveBeenCalledWith(
      '2026-05-16',
    )
    expect(quizRepository.createDefaultUserProgress).not.toHaveBeenCalled()
  })

  it('returns public quiz data with an audio URL and creates default progress', async () => {
    const quizRepository = createQuizRepository({
      findPublishedQuizzesByDate: vi.fn().mockResolvedValue([createQuiz()]),
      findUserProgress: vi.fn().mockResolvedValue(null),
      createDefaultUserProgress: vi.fn().mockResolvedValue(createProgress()),
    })

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createSessionRepository(),
        quizRepository,
        audioUrlSigner: createAudioUrlSigner(),
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'available',
      quiz: {
        id: 'quiz-1',
        quizDate: '2026-05-16',
        questionText: '정답이라고 생각하는 답을 모두 골라주세요',
        audioUrl: 'https://example.com/audio.mp3',
        choices: [
          { id: 'choice-a', text: '첫 번째 선택지' },
          { id: 'choice-b', text: '두 번째 선택지' },
          { id: 'choice-c', text: '세 번째 선택지' },
          { id: 'choice-d', text: '네 번째 선택지' },
          { id: 'choice-e', text: '다섯 번째 선택지' },
        ],
        promotionAmount: 10,
      },
      progress: {
        attemptCount: 0,
        lastSubmittedChoiceIds: [],
        isCorrect: false,
        canRetry: false,
        canViewScript: false,
        rewardStatus: 'none',
        needsRewardReview: false,
      },
    })
    expect(JSON.stringify(response.body)).not.toContain('correctChoiceIds')
    expect(JSON.stringify(response.body)).not.toContain('private script')
    expect(JSON.stringify(response.body)).not.toContain('audioStoragePath')
    expect(quizRepository.createDefaultUserProgress).toHaveBeenCalledWith({
      userId: 'user-internal-id',
      quizDate: '2026-05-16',
      now: new Date('2026-05-16T03:00:00.000Z'),
    })
  })

  it('returns existing progress without creating a duplicate document', async () => {
    const existingProgress = createProgress({
      attemptCount: 1,
      lastSubmittedChoiceIds: ['choice-b'],
      canRetry: true,
    })
    const quizRepository = createQuizRepository({
      findPublishedQuizzesByDate: vi.fn().mockResolvedValue([createQuiz()]),
      findUserProgress: vi.fn().mockResolvedValue(existingProgress),
    })

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createSessionRepository(),
        quizRepository,
        audioUrlSigner: createAudioUrlSigner(),
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body.progress).toEqual({
      attemptCount: 1,
      lastSubmittedChoiceIds: ['choice-b'],
      isCorrect: false,
      canRetry: true,
      canViewScript: false,
      rewardStatus: 'none',
      needsRewardReview: false,
    })
    expect(quizRepository.createDefaultUserProgress).not.toHaveBeenCalled()
  })

  it('returns empty when only another date has a published quiz', async () => {
    const quizRepository = createQuizRepository({
      findPublishedQuizzesByDate: vi.fn().mockImplementation((quizDate) =>
        quizDate === '2026-05-15' ? [createQuiz({ quizDate })] : [],
      ),
    })

    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createSessionRepository(),
        quizRepository,
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('empty')
  })

  it('returns a server error when the published quiz does not have exactly five choices', async () => {
    const response = await request(
      createTestApp({
        now: () => new Date('2026-05-16T03:00:00.000Z'),
        sessionRepository: createSessionRepository(),
        quizRepository: createQuizRepository({
          findPublishedQuizzesByDate: vi.fn().mockResolvedValue([
            createQuiz({
              choices: [{ id: 'choice-a', text: '첫 번째 선택지' }],
            }),
          ]),
        }),
        audioUrlSigner: createAudioUrlSigner(),
      }),
    )
      .get('/api/today-quiz')
      .set('Authorization', 'Bearer valid-session-token')

    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe('invalid_quiz_data')
  })
})
