import { Router } from 'express'

import { createSessionToken as createDefaultSessionToken, getKstDayEnd } from '../auth/session'
import {
  TossAuthError,
  TossAuthHttpClient,
  getTossApiConfig,
  type TossAuthClient,
  type TossReferrer,
} from '../auth/tossClient'
import {
  FirestoreUserSessionRepository,
  type UserSessionRepository,
} from '../auth/userSessionRepository'

type TossLoginRouterOptions = {
  tossAuthClient?: TossAuthClient
  userSessionRepository?: UserSessionRepository
  now?: () => Date
  createSessionToken?: () => string
}

type TossLoginRequestBody = {
  authorizationCode?: unknown
  referrer?: unknown
}

const ALLOWED_REFERRERS = new Set<TossReferrer>(['DEFAULT', 'SANDBOX'])

export function createTossLoginRouter(options: TossLoginRouterOptions = {}) {
  const router = Router()
  const tossAuthClient =
    options.tossAuthClient ??
    new TossAuthHttpClient({
      ...getTossApiConfig(process.env),
    })
  const now = options.now ?? (() => new Date())
  const createSessionToken = options.createSessionToken ?? createDefaultSessionToken

  router.post('/', async (request, response) => {
    const body = request.body as TossLoginRequestBody
    const authorizationCode = validateAuthorizationCode(body.authorizationCode)

    if (authorizationCode == null) {
      response.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'authorizationCode is required',
        },
      })
      return
    }

    const referrer = validateReferrer(body.referrer)

    if (referrer == null) {
      response.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'referrer must be DEFAULT or SANDBOX',
        },
      })
      return
    }

    try {
      const tokenResult = await tossAuthClient.exchangeAuthorizationCode({
        authorizationCode,
        referrer,
      })
      const userInfo = await tossAuthClient.fetchUserInfo(tokenResult.accessToken)
      const requestTime = now()
      const userSessionRepository =
        options.userSessionRepository ?? new FirestoreUserSessionRepository()
      const session = await userSessionRepository.createSessionForTossUser({
        userKey: userInfo.userKey,
        now: requestTime,
        sessionToken: createSessionToken(),
        expiresAt: getKstDayEnd(requestTime),
      })

      response.json({
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt.toISOString(),
        user: {
          id: session.userId,
        },
      })
    } catch (error) {
      if (error instanceof TossAuthError && error.code === 'invalid_grant') {
        response.status(401).json({
          error: {
            code: 'login_retry_required',
            message: 'Toss login could not be completed. Please try again.',
          },
        })
        return
      }

      if (
        error instanceof TossAuthError &&
        (error.code === 'USER_KEY_NOT_FOUND' || error.code === 'USER_NOT_FOUND')
      ) {
        response.status(401).json({
          error: {
            code: 'user_identification_failed',
            message: 'Toss user could not be identified.',
          },
        })
        return
      }

      response.status(500).json({
        error: {
          code: 'login_failed',
          message: 'Login could not be completed.',
        },
      })
    }
  })

  return router
}

function validateAuthorizationCode(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function validateReferrer(value: unknown): TossReferrer | null {
  if (typeof value !== 'string') {
    return null
  }

  return ALLOWED_REFERRERS.has(value as TossReferrer) ? (value as TossReferrer) : null
}
