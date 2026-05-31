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

export type TodayQuizChoice = {
  id: string;
  text: string;
};

export type TodayQuizResponse = {
  quizDate: string;
  audioUrl: string;
  choices: TodayQuizChoice[];
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

export async function getTodayQuiz(appSessionToken: string, signal?: AbortSignal): Promise<TodayQuizResponse> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/today-quiz`, {
    headers: {
      authorization: `Bearer ${appSessionToken}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to get today quiz.');
  }

  const body = (await response.json()) as Partial<TodayQuizResponse>;

  if (
    typeof body.quizDate !== 'string' ||
    typeof body.audioUrl !== 'string' ||
    !Array.isArray(body.choices) ||
    body.choices.length !== 5 ||
    !body.choices.every(isTodayQuizChoice)
  ) {
    throw new Error('Invalid today quiz response.');
  }

  return {
    quizDate: body.quizDate,
    audioUrl: body.audioUrl,
    choices: body.choices,
  };
}

function isProgressStatus(value: unknown): value is ProgressStatus {
  return value === 'not_started' || value === 'wrong' || value === 'retry_unlocked' || value === 'completed';
}

function isRewardStatus(value: unknown): value is RewardStatus {
  return value === 'none' || value === 'pending' || value === 'success' || value === 'failed';
}

function isTodayQuizChoice(value: unknown): value is TodayQuizChoice {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const choice = value as Partial<TodayQuizChoice>;

  return typeof choice.id === 'string' && typeof choice.text === 'string';
}
