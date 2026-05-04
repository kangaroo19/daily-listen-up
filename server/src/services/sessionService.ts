import { randomUUID } from 'node:crypto';
import type { SessionResponse } from '../../../shared/api/contracts.js';
import type { AppRepository } from '../repositories/types.js';
import { AppError } from './errors.js';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export class SessionService {
  constructor(private readonly repository: AppRepository) {}

  async createSession(userKey: string) {
    const sessionId = randomUUID();

    await this.repository.saveSession({
      sessionId,
      userKey,
      expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    });

    return {
      sessionId,
      maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
    };
  }

  async requireSession(
    sessionId: string | undefined,
  ): Promise<SessionResponse> {
    if (sessionId == null || sessionId.trim() === '') {
      throw new AppError(401, 'unauthenticated', '로그인이 필요해요.');
    }

    const session = await this.repository.findSession(sessionId);

    if (session == null) {
      throw new AppError(401, 'unauthenticated', '로그인이 필요해요.');
    }

    return {
      authenticated: true,
      userKey: session.userKey,
    };
  }
}
