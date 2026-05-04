export type HttpMethod = 'GET' | 'POST';

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
};

export const API_ENDPOINTS = {
  health: { method: 'GET', path: '/api/health' },
  tossLogin: { method: 'POST', path: '/api/auth/toss-login' },
  session: { method: 'GET', path: '/api/auth/session' },
  meToday: { method: 'GET', path: '/api/me/today' },
  submitQuiz: { method: 'POST', path: '/api/quiz/submit' },
  submissionResult: {
    method: 'POST',
    path: '/api/quiz-submissions/:submissionId/result',
  },
  tossPointReward: { method: 'POST', path: '/api/rewards/toss-point' },
} as const satisfies Record<string, ApiEndpoint>;

export type HealthResponse = {
  ok: true;
};

export type TossLoginRequest = {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
};

export type TossLoginResponse = {
  userKey: string;
};

export type SessionResponse = {
  authenticated: true;
  userKey: string;
};

export type TodayProgressStatus =
  | 'no_quiz'
  | 'not_started'
  | 'submitted'
  | 'correct'
  | 'incorrect'
  | 'completed';

export type PromotionStatus =
  | 'none'
  | 'requested'
  | 'granted'
  | 'already_granted'
  | 'failed';

export type TodayProgressResponse = {
  quizDate: string;
  status: TodayProgressStatus;
  attemptCount: number;
  hasEarnedRetry: boolean;
  isPromotionGranted: boolean;
  promotionStatus: PromotionStatus;
};

export type SubmitQuizRequest = {
  quizDate: string;
  quizId: string;
  choiceIndex: number;
};

export type SubmitQuizResponse = {
  submissionId: string;
  requiresInterstitialAd: true;
};

export type SubmissionResultRequest = {
  interstitialAdCompleted?: boolean;
};

export type SubmissionResultResponse = {
  isCorrect: boolean;
  status: 'correct' | 'incorrect';
  attemptCount: number;
};

export type TossPointRewardRequest = {
  quizDate: string;
  quizId: string;
};

export type TossPointRewardResponse = {
  promotionStatus: Exclude<PromotionStatus, 'none'>;
  isPromotionGranted: boolean;
};

export type ApiErrorCode =
  | 'not_implemented'
  | 'endpoint_not_found'
  | 'invalid_request'
  | 'auth_required'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'external_service_error'
  | 'server_error'
  | 'internal_error';

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
};
