import { getStorage } from 'firebase-admin/storage';
import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { getPublicTodayQuiz, TodayQuizAccessError } from '../services/todayQuiz.js';
import { getBearerToken } from '../services/sessionBoundary.js';
import { sendJson } from './responses.js';

export async function handleTodayQuiz(req: Request, res: Response): Promise<void> {
  const token = getBearerToken(req);

  if (token == null) {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  try {
    const quiz = await getPublicTodayQuiz(token, getApiBaseUrl(req));

    if (quiz == null) {
      sendJson(res, 404, {
        code: 'today_quiz_not_found',
      });
      return;
    }

    sendJson(res, 200, quiz);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('App session')) {
      sendJson(res, 401, {
        code: 'unauthorized',
      });
      return;
    }

    if (error instanceof TodayQuizAccessError) {
      sendJson(res, 409, {
        code: error.code,
      });
      return;
    }

    sendJson(res, 500, {
      code: 'today_quiz_failed',
    });
  }
}

export async function handleQuizAudio(req: Request, res: Response): Promise<void> {
  const quizDate = typeof req.query.quizDate === 'string' ? req.query.quizDate : null;

  if (quizDate == null || quizDate.trim() === '') {
    sendJson(res, 400, {
      code: 'invalid_quiz_date',
    });
    return;
  }

  try {
    const quiz = await findPublishedQuizByDate(quizDate);

    if (quiz == null) {
      sendJson(res, 404, {
        code: 'quiz_audio_not_found',
      });
      return;
    }

    const file = getStorage().bucket(getStorageBucket()).file(quiz.audioStoragePath);
    const [exists] = await file.exists();

    if (!exists) {
      sendJson(res, 404, {
        code: 'quiz_audio_not_found',
      });
      return;
    }

    res.status(200).set({
      'content-type': 'audio/mpeg',
      'cache-control': 'private, max-age=300',
    });
    file.createReadStream().pipe(res);
  } catch {
    sendJson(res, 500, {
      code: 'quiz_audio_failed',
    });
  }
}

function getApiBaseUrl(req: Request): string {
  const protocol = req.protocol;
  const host = req.get('host');

  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up';

    return `${protocol}://${host}/${projectId}/asia-northeast3/api/api`;
  }

  const originalUrl = req.originalUrl.split('?')[0];
  const path = req.path;
  const prefix = originalUrl.endsWith(path) ? originalUrl.slice(0, -path.length) : '';

  return `${protocol}://${host}${prefix}/api`;
}

function getStorageBucket(): string {
  const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up';

  return process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`;
}
