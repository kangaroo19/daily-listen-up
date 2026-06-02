import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { findRewardGrant } from '../repositories/rewardGrantRepository.js';
import { findUserProgress } from '../repositories/userProgressRepository.js';
import { resolveRewardStatus } from '../services/homeEntry.js';
import { refreshPendingRewardStatus } from '../services/pointReward.js';
import { getBearerToken, requireAppSession, type AppSessionContext } from '../services/sessionBoundary.js';
import { getKstDateString } from '../utils/kstDate.js';
import { sendJson } from './responses.js';

export async function handleRewardStatus(req: Request, res: Response): Promise<void> {
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

  try {
    const quizDate = getKstDateString();
    const progress = await findUserProgress(session.userId, quizDate);
    let rewardGrant = await findRewardGrant(session.userId, quizDate);

    if (progress != null && rewardGrant?.status === 'pending') {
      const refreshed = await refreshPendingRewardStatus({ progress, rewardGrant });
      rewardGrant = {
        ...rewardGrant,
        status: refreshed.status,
      };
    }

    sendJson(res, 200, resolveRewardStatus(progress, rewardGrant));
  } catch {
    sendJson(res, 500, {
      code: 'reward_status_failed',
    });
  }
}
