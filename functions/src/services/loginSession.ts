import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import type { AppSession, User } from '../domain/models.js';
import { getKstEndOfDay } from '../utils/kstDate.js';
import type { TossLoginClient, TossReferrer } from './tossLoginClient.js';

export type LoginSessionRequest = {
  authorizationCode: string;
  referrer: TossReferrer;
  now?: Date;
};

export type LoginSessionResult = {
  appSessionToken: string;
  expiresAt: string;
};

export type UserRepository = {
  findByUserKey(userKey: string): Promise<User | null>;
  save(user: User): Promise<void>;
};

export type SessionRepository = {
  save(tokenId: string, session: AppSession): Promise<void>;
};

export type LoginSessionDependencies = {
  tossClient: TossLoginClient;
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  createSessionToken?: () => string;
  createUserId?: () => string;
  hashSessionToken?: (token: string) => string;
};

export async function createLoginSession(
  request: LoginSessionRequest,
  dependencies: LoginSessionDependencies,
): Promise<LoginSessionResult> {
  const now = request.now ?? new Date();
  const token = await dependencies.tossClient.generateToken({
    authorizationCode: request.authorizationCode,
    referrer: request.referrer,
  });
  const tossUser = await dependencies.tossClient.getLoginMe(token.accessToken);
  const existingUser = await dependencies.userRepository.findByUserKey(tossUser.userKey);
  const userId = existingUser?.userId ?? dependencies.createUserId?.() ?? createInternalUserId();
  const loggedInAt = Timestamp.fromDate(now);

  await dependencies.userRepository.save({
    userId,
    userKey: tossUser.userKey,
    loggedInAt,
  });

  const appSessionToken = dependencies.createSessionToken?.() ?? createAppSessionToken();
  const sessionTokenId = dependencies.hashSessionToken?.(appSessionToken) ?? hashAppSessionToken(appSessionToken);
  const expiresAtDate = getKstEndOfDay(now);
  const expiresAt = Timestamp.fromDate(expiresAtDate);

  await dependencies.sessionRepository.save(sessionTokenId, {
    sessionTokenId,
    userId,
    expiresAt,
  });

  return {
    appSessionToken,
    expiresAt: expiresAtDate.toISOString(),
  };
}

export function createAppSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function createInternalUserId(): string {
  return `user_${randomUUID().replace(/-/g, '')}`;
}

export function hashAppSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
