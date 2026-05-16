import { Router, type Response } from 'express'

import { getKstQuizDate } from '../auth/session'
import {
  FirestoreCurrentSessionRepository,
  type CurrentSessionRepository,
} from '../auth/userSessionRepository'
import type { UserProgressDocument } from '../firebase/collections'

type MeRouterOptions = {
  sessionRepository?: CurrentSessionRepository
  now?: () => Date
}

export function createMeRouter(options: MeRouterOptions = {}) {
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
      const session = await sessionRepository.findSessionByToken(sessionToken)
      const requestTime = now()

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
      const progress = await sessionRepository.findUserProgress({
        userId: user.id,
        quizDate,
      })

      response.json({
        user: {
          id: user.id,
        },
        session: {
          expiresAt: session.expiresAt.toISOString(),
        },
        today: {
          quizDate,
          progress: progress == null ? null : toPublicProgress(progress),
        },
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
