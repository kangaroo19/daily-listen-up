import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { getBearerToken, requireAppSession } from '../services/sessionBoundary.js';
import { getKstDateString } from '../utils/kstDate.js';
import { sendJson } from './responses.js';

export async function handleCheckTodayQuiz(req: Request, res: Response): Promise<void> {
  const token = getBearerToken(req);

  if (token == null) {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  try {
    await requireAppSession(token);
  } catch {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  try {
    const quiz = await findPublishedQuizByDate(getKstDateString());

    sendJson(res, 200, {
      hasTodayQuiz: quiz != null,
    });
  } catch {
    sendJson(res, 500, {
      code: 'check_today_quiz_failed',
    });
  }
}
