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

export type AnswerResultResponse = {
  isCorrect: boolean;
  progressStatus: Exclude<ProgressStatus, 'not_started' | 'retry_unlocked'>;
  rewardStatus: RewardStatus;
};

export type RewardedAdPurpose = 'retry' | 'script';

export type RewardedAdCompleteResponse = {
  progressStatus: ProgressStatus;
  canViewScript: boolean;
  script?: string;
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

export async function postAnswerResult(
  appSessionToken: string,
  request: {
    quizDate: string;
    selectedChoiceIds: string[];
  },
): Promise<AnswerResultResponse> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/answer-result`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${appSessionToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to submit answer result.');
  }

  const body = (await response.json()) as Partial<AnswerResultResponse>;

  if (
    typeof body.isCorrect !== 'boolean' ||
    (body.progressStatus !== 'wrong' && body.progressStatus !== 'completed') ||
    !isRewardStatus(body.rewardStatus)
  ) {
    throw new Error('Invalid answer result response.');
  }

  return {
    isCorrect: body.isCorrect,
    progressStatus: body.progressStatus,
    rewardStatus: body.rewardStatus,
  };
}

export async function postRewardedAdComplete(
  appSessionToken: string,
  request: {
    quizDate: string;
    purpose: RewardedAdPurpose;
    userEarnedReward: boolean;
  },
): Promise<RewardedAdCompleteResponse> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/rewarded-ad-complete`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${appSessionToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to complete rewarded ad.');
  }

  const body = (await response.json()) as Partial<RewardedAdCompleteResponse>;

  if (!isProgressStatus(body.progressStatus) || typeof body.canViewScript !== 'boolean') {
    throw new Error('Invalid rewarded ad complete response.');
  }

  if (request.purpose === 'script' && typeof body.script !== 'string') {
    throw new Error('Invalid rewarded ad script response.');
  }

  if (request.purpose === 'retry' && 'script' in body) {
    throw new Error('Invalid rewarded ad retry response.');
  }

  return {
    progressStatus: body.progressStatus,
    canViewScript: body.canViewScript,
    ...(typeof body.script === 'string' ? { script: body.script } : {}),
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
