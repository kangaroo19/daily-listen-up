import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { AnswerResultError, submitAnswerResult } from '../services/answerResult.js';
import { getBearerToken } from '../services/sessionBoundary.js';
import { sendJson } from './responses.js';

export async function handleAnswerResult(req: Request, res: Response): Promise<void> {
  const token = getBearerToken(req);

  if (token == null) {
    sendJson(res, 401, {
      code: 'unauthorized',
    });
    return;
  }

  const body = req.body as Partial<{ quizDate: unknown; selectedChoiceIds: unknown }>;

  if (typeof body.quizDate !== 'string' || !Array.isArray(body.selectedChoiceIds) || !body.selectedChoiceIds.every(isString)) {
    sendJson(res, 400, {
      code: 'invalid_answer_result_request',
    });
    return;
  }

  try {
    const result = await submitAnswerResult({
      token,
      quizDate: body.quizDate,
      selectedChoiceIds: body.selectedChoiceIds,
    });

    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('App session')) {
      sendJson(res, 401, {
        code: 'unauthorized',
      });
      return;
    }

    if (error instanceof AnswerResultError) {
      sendJson(res, error.code === 'quiz_not_found' ? 404 : 409, {
        code: error.code,
      });
      return;
    }

    sendJson(res, 500, {
      code: 'answer_result_failed',
    });
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
