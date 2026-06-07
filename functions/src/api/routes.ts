import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { handleAnswerResult } from './answerResult.js';
import { handleCheckTodayQuiz } from './checkTodayQuiz.js';
import { handleLoginToss } from './loginToss.js';
import { handleRewardedAdComplete } from './rewardedAdComplete.js';
import { handleRewardStatus } from './rewardStatus.js';
import { handleQuizAudio, handleTodayQuiz } from './todayQuiz.js';
import { sendJson, setCorsHeaders } from './responses.js';

type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
  'POST /api/login/toss': handleLoginToss,
  'GET /api/check-today-quiz': handleCheckTodayQuiz,
  'GET /api/today-quiz': handleTodayQuiz,
  'GET /api/quiz-audio': handleQuizAudio,
  'GET /api/reward-status': handleRewardStatus,
  'POST /api/answer-result': handleAnswerResult,
  'POST /api/rewarded-ad-complete': handleRewardedAdComplete,
};

export async function routeApi(req: Request, res: Response): Promise<void> {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(204).end();
    return;
  }

  const path = normalizePath(req.path);
  const handler = routes[`${req.method} ${path}`];

  if (handler == null) {
    sendJson(res, 404, {
      code: 'not_found',
      method: req.method,
      path,
    });
    return;
  }

  await handler(req, res);
}

function normalizePath(path: string): string {
  if (path === '' || path === '/') {
    return '/api';
  }

  return path.endsWith('/') ? path.slice(0, -1) : path;
}
