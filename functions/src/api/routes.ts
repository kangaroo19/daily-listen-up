import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { collections } from '../domain/collections.js';
import { getKstDateString } from '../utils/kstDate.js';
import { handleLoginToss } from './loginToss.js';
import { sendJson, sendNotImplemented } from './responses.js';

type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
  'POST /api/login/toss': handleLoginToss,
  'GET /api/check-today-quiz': (_req, res) => {
    sendNotImplemented(res, 'GET /api/check-today-quiz', '03-toss-login-session and 04-home-today-quiz-entry', {
      todayKst: getKstDateString(),
      collections: [collections.appSessions, collections.quizzes],
      returnsOnly: ['hasTodayQuiz'],
    });
  },
  'GET /api/today-quiz': (_req, res) => {
    sendNotImplemented(res, 'GET /api/today-quiz', '04-home-today-quiz-entry and 05-audio-multiple-choice-quiz', {
      publicResponseFields: ['quizDate', 'audioUrl', 'choices'],
      serverOnlyQuizFields: ['correctChoiceIds', 'script', 'promotionAmount', 'audioStoragePath'],
      storageBoundary: 'audioStoragePath is converted to audioUrl on the server.',
    });
  },
  'GET /api/reward-status': (_req, res) => {
    sendNotImplemented(res, 'GET /api/reward-status', '03-toss-login-session and 04-home-today-quiz-entry', {
      progressStatus: ['not_started', 'wrong', 'retry_unlocked', 'completed'],
      rewardStatus: ['none', 'pending', 'success', 'failed'],
      collections: [collections.appSessions, collections.userProgress, collections.rewardGrants],
    });
  },
  'POST /api/answer-result': (_req, res) => {
    sendNotImplemented(res, 'POST /api/answer-result', '06-answer-submit-interstitial-result', {
      serverOnly: ['correctChoiceIds', 'promotionAmount'],
      collections: [collections.quizzes, collections.userProgress, collections.rewardGrants],
    });
  },
  'POST /api/rewarded-ad-complete': (_req, res) => {
    sendNotImplemented(res, 'POST /api/rewarded-ad-complete', '08-result-retry-script', {
      purposes: ['retry', 'script'],
      requiresServerRewardEvent: true,
      collections: [collections.appSessions, collections.userProgress, collections.adRewardEvents],
    });
  },
};

export async function routeApi(req: Request, res: Response): Promise<void> {
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
