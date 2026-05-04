import {
  API_ENDPOINTS,
  type HealthResponse,
} from '../../../shared/api/contracts.js';
import { tossClient } from '../integrations/toss/client.js';
import { logger } from '../logging/logger.js';
import { appRepository } from '../repositories/inMemoryRepository.js';
import { AuthService } from '../services/authService.js';
import { toAppError } from '../services/errors.js';
import { QuizService } from '../services/quizService.js';
import { SessionService } from '../services/sessionService.js';
import { createSessionCookie, readSessionId } from './cookies.js';
import { readJsonBody } from './request.js';
import { jsonError, jsonOk } from './responses.js';
import { matchRoute } from './router.js';

const sessionService = new SessionService(appRepository);
const authService = new AuthService(tossClient);
const quizService = new QuizService(appRepository);

export async function handleApiRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return jsonError(404, 'endpoint_not_found', 'API 경로를 찾을 수 없어요.');
    }

    if (
      request.method === API_ENDPOINTS.health.method &&
      url.pathname === API_ENDPOINTS.health.path
    ) {
      return jsonOk<HealthResponse>({ ok: true });
    }

    if (
      request.method === API_ENDPOINTS.tossLogin.method &&
      url.pathname === API_ENDPOINTS.tossLogin.path
    ) {
      const loginResult = await authService.loginWithToss(
        await readJsonBody(request),
      );
      const session = await sessionService.createSession(loginResult.userKey);

      return jsonOk(loginResult, {
        headers: {
          'Set-Cookie': createSessionCookie(
            session.sessionId,
            session.maxAgeSeconds,
          ),
        },
      });
    }

    if (
      request.method === API_ENDPOINTS.session.method &&
      url.pathname === API_ENDPOINTS.session.path
    ) {
      const session = await sessionService.requireSession(
        readSessionId(request),
      );
      return jsonOk(session);
    }

    if (
      request.method === API_ENDPOINTS.meToday.method &&
      url.pathname === API_ENDPOINTS.meToday.path
    ) {
      const session = await sessionService.requireSession(
        readSessionId(request),
      );
      return jsonOk(await quizService.getToday(session.userKey));
    }

    if (
      request.method === API_ENDPOINTS.submitQuiz.method &&
      url.pathname === API_ENDPOINTS.submitQuiz.path
    ) {
      const session = await sessionService.requireSession(
        readSessionId(request),
      );
      return jsonOk(
        await quizService.submit(session.userKey, await readJsonBody(request)),
      );
    }

    const resultRoute = matchRoute(
      API_ENDPOINTS.submissionResult,
      request.method,
      url.pathname,
    );

    if (resultRoute != null) {
      const session = await sessionService.requireSession(
        readSessionId(request),
      );
      return jsonOk(
        await quizService.getResult(
          session.userKey,
          resultRoute.params.submissionId,
          await readJsonBody(request),
        ),
      );
    }

    if (
      request.method === API_ENDPOINTS.tossPointReward.method &&
      url.pathname === API_ENDPOINTS.tossPointReward.path
    ) {
      const session = await sessionService.requireSession(
        readSessionId(request),
      );
      return jsonOk(
        await quizService.requestTossPoint(
          session.userKey,
          await readJsonBody(request),
        ),
      );
    }

    return jsonError(404, 'endpoint_not_found', 'API 경로를 찾을 수 없어요.');
  } catch (error) {
    const appError = toAppError(error);

    if (appError.status >= 500) {
      logger.error('api_request_failed', error);
    }

    return jsonError(appError.status, appError.code, appError.message);
  }
}
