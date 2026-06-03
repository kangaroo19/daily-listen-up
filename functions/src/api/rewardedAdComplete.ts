import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { completeRewardedAd, RewardedAdCompleteError, type RewardedAdPurpose } from '../services/rewardedAdComplete.js';
import { getBearerToken, requireAppSession, type AppSessionContext } from '../services/sessionBoundary.js';
import { sendJson } from './responses.js';

export async function handleRewardedAdComplete(req: Request, res: Response): Promise<void> {
  const token = getBearerToken(req);

  if (token == null) {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  let session: AppSessionContext;

  try {
    session = await requireAppSession(token);
  } catch {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  const body = req.body as Partial<{ quizDate: unknown; purpose: unknown; userEarnedReward: unknown }>;

  if (typeof body.quizDate !== 'string' || !isRewardedAdPurpose(body.purpose) || typeof body.userEarnedReward !== 'boolean') {
    sendJson(res, 400, {
      code: 'invalid_rewarded_ad_complete_request',
    });
    return;
  }

  try {
    const result = await completeRewardedAd({
      userId: session.userId,
      quizDate: body.quizDate,
      purpose: body.purpose,
      userEarnedReward: body.userEarnedReward,
    });

    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof RewardedAdCompleteError) {
      sendJson(res, error.code === 'quiz_not_found' ? 404 : 409, {
        code: error.code,
      });
      return;
    }

    sendJson(res, 500, {
      code: 'rewarded_ad_complete_failed',
    });
  }
}

function isRewardedAdPurpose(value: unknown): value is RewardedAdPurpose {
  return value === 'retry' || value === 'script';
}
