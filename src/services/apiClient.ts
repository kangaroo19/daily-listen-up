import { clientEnv } from '../config/clientEnv';
import type { TossLoginResult } from '../integrations/toss';
import type { AppSession } from './appSession';

export type CheckTodayQuizResponse = {
  hasTodayQuiz: boolean;
};

export type ProgressStatus = 'not_started' | 'wrong' | 'retry_unlocked' | 'completed';

export type RewardStatus = 'none' | 'pending' | 'success' | 'failed';

export type RewardStatusResponse = {
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
};

export async function postTossLogin(loginResult: TossLoginResult): Promise<AppSession> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/login/toss`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      authorizationCode: loginResult.authorizationCode,
      referrer: loginResult.referrer,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create app session.');
  }

  const body = (await response.json()) as Partial<AppSession>;

  if (typeof body.appSessionToken !== 'string' || typeof body.expiresAt !== 'string') {
    throw new Error('Invalid app session response.');
  }

  return {
    appSessionToken: body.appSessionToken,
    expiresAt: body.expiresAt,
  };
}

export async function getCheckTodayQuiz(appSessionToken: string): Promise<CheckTodayQuizResponse> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/check-today-quiz`, {
    headers: {
      authorization: `Bearer ${appSessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check today quiz.');
  }

  const body = (await response.json()) as Partial<CheckTodayQuizResponse>;

  if (typeof body.hasTodayQuiz !== 'boolean') {
    throw new Error('Invalid today quiz response.');
  }

  return {
    hasTodayQuiz: body.hasTodayQuiz,
  };
}

export async function getRewardStatus(appSessionToken: string): Promise<RewardStatusResponse> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/reward-status`, {
    headers: {
      authorization: `Bearer ${appSessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get reward status.');
  }

  const body = (await response.json()) as Partial<RewardStatusResponse>;

  if (!isProgressStatus(body.progressStatus) || !isRewardStatus(body.rewardStatus)) {
    throw new Error('Invalid reward status response.');
  }

  return {
    progressStatus: body.progressStatus,
    rewardStatus: body.rewardStatus,
  };
}

function isProgressStatus(value: unknown): value is ProgressStatus {
  return value === 'not_started' || value === 'wrong' || value === 'retry_unlocked' || value === 'completed';
}

function isRewardStatus(value: unknown): value is RewardStatus {
  return value === 'none' || value === 'pending' || value === 'success' || value === 'failed';
}
