export type HttpMethod = 'GET' | 'POST';

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
};

export const API_ENDPOINTS = {
  health: { method: 'GET', path: '/api/health' },
  tossLogin: { method: 'POST', path: '/api/auth/toss-login' },
  session: { method: 'GET', path: '/api/auth/session' },
  submitQuiz: { method: 'POST', path: '/api/quiz/submit' },
  tossPointReward: { method: 'POST', path: '/api/rewards/toss-point' },
} as const satisfies Record<string, ApiEndpoint>;

export const RESERVED_API_ENDPOINTS = [
  API_ENDPOINTS.tossLogin,
  API_ENDPOINTS.session,
  API_ENDPOINTS.submitQuiz,
  API_ENDPOINTS.tossPointReward,
] as const;

export type HealthResponse = {
  ok: true;
};

export type ApiErrorCode =
  | 'not_implemented'
  | 'endpoint_not_found'
  | 'invalid_request'
  | 'auth_required'
  | 'server_error';

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
};
