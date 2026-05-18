import { Router, type Response } from 'express'

import { getKstQuizDate } from '../auth/session'
import {
  FirestoreCurrentSessionRepository,
  type CurrentSessionRepository,
} from '../auth/userSessionRepository'
import type { UserProgressDocument } from '../firebase/collections'
import {
  FirebaseStorageAudioUrlSigner,
  type AudioUrlSigner,
} from '../quiz/audioUrlSigner'
import {
  FirestoreTodayQuizRepository,
  type StoredQuizResult,
  type TodayQuizRepository,
} from '../quiz/todayQuizRepository'

type TodayQuizRouterOptions = {
  sessionRepository?: CurrentSessionRepository
  quizRepository?: TodayQuizRepository
  audioUrlSigner?: AudioUrlSigner
  now?: () => Date
}

export function createTodayQuizRouter(options: TodayQuizRouterOptions = {}) {
  const router = Router()
  const now = options.now ?? (() => new Date())

  router.get('/', async (request, response) => {
    const sessionToken = parseBearerToken(request.header('Authorization'))

    if (sessionToken == null) {
      sendUnauthorized(response)
      return
    }

    try {
      const sessionRepository =
        options.sessionRepository ?? new FirestoreCurrentSessionRepository()
      const quizRepository =
        options.quizRepository ?? new FirestoreTodayQuizRepository()
      const audioUrlSigner =
        options.audioUrlSigner ?? new FirebaseStorageAudioUrlSigner()
      const requestTime = now()
      const session = await sessionRepository.findSessionByToken(sessionToken)

      if (
        session == null ||
        session.expiresAt.getTime() <= requestTime.getTime()
      ) {
        sendUnauthorized(response)
        return
      }

      const user = await sessionRepository.findUserById(session.userId)

      if (user == null) {
        response.status(500).json({
          error: {
            code: 'session_user_not_found',
            message: 'Session user could not be loaded.',
          },
        })
        return
      }

      const quizDate = getKstQuizDate(requestTime)
      const quizzes = await quizRepository.findPublishedQuizzesByDate(quizDate)

      if (quizzes.length === 0) {
        response.json({
          status: 'empty',
          quiz: null,
          progress: null,
        })
        return
      }

      if (quizzes.length > 1) {
        response.status(500).json({
          error: {
            code: 'multiple_published_quizzes',
            message: 'Multiple published quizzes were found for today.',
          },
        })
        return
      }

      const quiz = quizzes[0]

      if (!isValidQuizForPublicResponse(quiz)) {
        response.status(500).json({
          error: {
            code: 'invalid_quiz_data',
            message: 'Today quiz data is invalid.',
          },
        })
        return
      }

      const audioUrl = await audioUrlSigner.createReadUrl(quiz.audioStoragePath)
      const existingProgress = await quizRepository.findUserProgress({
        userId: user.id,
        quizDate,
      })
      const progress =
        existingProgress ??
        (await quizRepository.createDefaultUserProgress({
          userId: user.id,
          quizDate,
          now: requestTime,
        }))

      response.json({
        status: 'available',
        quiz: toPublicQuiz(quiz, audioUrl),
        progress: toPublicProgress(progress),
      })
    } catch {
      response.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'Request could not be completed.',
        },
      })
    }
  })

  return router
}

function parseBearerToken(authorizationHeader: string | undefined) {
  if (authorizationHeader == null) {
    return null
  }

  const [scheme, token, extra] = authorizationHeader.split(' ')

  if (
    scheme !== 'Bearer' ||
    token == null ||
    token.trim().length === 0 ||
    extra != null
  ) {
    return null
  }

  return token
}

function sendUnauthorized(response: Response) {
  response.status(401).json({
    error: {
      code: 'unauthorized',
      message: 'Authentication is required.',
    },
  })
}

function isValidQuizForPublicResponse(quiz: StoredQuizResult) {
  return quiz.audioStoragePath.trim().length > 0 && quiz.choices.length === 5
}

function toPublicQuiz(quiz: StoredQuizResult, audioUrl: string) {
  return {
    id: quiz.id,
    quizDate: quiz.quizDate,
    questionText: quiz.questionText,
    audioUrl,
    choices: quiz.choices,
    promotionAmount: quiz.promotionAmount,
  }
}

function toPublicProgress(progress: UserProgressDocument) {
  return {
    attemptCount: progress.attemptCount,
    lastSubmittedChoiceIds: progress.lastSubmittedChoiceIds,
    isCorrect: progress.isCorrect,
    canRetry: progress.canRetry,
    canViewScript: progress.canViewScript,
    rewardStatus: progress.rewardStatus,
    needsRewardReview: progress.needsRewardReview,
  }
}
