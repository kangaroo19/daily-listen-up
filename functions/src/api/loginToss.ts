import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { createFirestoreSessionRepository } from '../repositories/sessionRepository.js';
import { createFirestoreUserRepository } from '../repositories/userRepository.js';
import { createLoginSession } from '../services/loginSession.js';
import { createTossLoginClient, type TossReferrer } from '../services/tossLoginClient.js';
import { sendJson } from './responses.js';

type LoginTossBody = {
  authorizationCode?: unknown;
  referrer?: unknown;
};

export async function handleLoginToss(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as LoginTossBody;

  if (!isValidLoginRequest(body)) {
    sendJson(res, 400, {
      code: 'invalid_request',
    });
    return;
  }

  try {
    const result = await createLoginSession(
      {
        authorizationCode: body.authorizationCode,
        referrer: body.referrer,
      },
      {
        tossClient: createTossLoginClient(),
        userRepository: createFirestoreUserRepository(),
        sessionRepository: createFirestoreSessionRepository(),
      },
    );

    sendJson(res, 200, result);
  } catch (error) {
    console.error('Toss login session failed', error);
    sendJson(res, 502, {
      code: 'login_failed',
    });
  }
}

function isValidLoginRequest(body: LoginTossBody): body is { authorizationCode: string; referrer: TossReferrer } {
  return (
    typeof body.authorizationCode === 'string' &&
    body.authorizationCode.length > 0 &&
    (body.referrer === 'DEFAULT' || body.referrer === 'SANDBOX')
  );
}
