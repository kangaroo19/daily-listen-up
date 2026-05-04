import {
  API_ENDPOINTS,
  type ApiErrorResponse,
  type HealthResponse,
  type SessionResponse,
  type SubmissionResultRequest,
  type SubmissionResultResponse,
  type SubmitQuizRequest,
  type SubmitQuizResponse,
  type TodayProgressResponse,
  type TossLoginRequest,
  type TossLoginResponse,
  type TossPointRewardRequest,
  type TossPointRewardResponse,
} from '../../../shared/api/contracts';

export type ApiClient = {
  request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
  getHealth(): Promise<HealthResponse>;
  loginWithToss(request: TossLoginRequest): Promise<TossLoginResponse>;
  getSession(): Promise<SessionResponse>;
  getTodayProgress(): Promise<TodayProgressResponse>;
  submitQuiz(request: SubmitQuizRequest): Promise<SubmitQuizResponse>;
  getSubmissionResult(
    submissionId: string,
    request?: SubmissionResultRequest,
  ): Promise<SubmissionResultResponse>;
  requestTossPoint(
    request: TossPointRewardRequest,
  ): Promise<TossPointRewardResponse>;
};

type CreateApiClientOptions = {
  baseUrl: string;
};

export type ApiFailureKind =
  | 'network'
  | 'parse'
  | 'auth_required'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'not_implemented'
  | 'external_service'
  | 'server'
  | 'unknown';

export function createApiClient({
  baseUrl,
}: CreateApiClientOptions): ApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function request<TResponse>(
    path: string,
    init?: RequestInit,
  ): Promise<TResponse> {
    let response: Response;

    try {
      response = await fetch(buildApiUrl(normalizedBaseUrl, path), {
        credentials: 'same-origin',
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    } catch (error) {
      throw new ApiError('network', 0, '백엔드에 연결할 수 없어요.', error);
    }

    if (!response.ok) {
      throw await createApiError(response);
    }

    try {
      return (await response.json()) as TResponse;
    } catch (error) {
      throw new ApiError(
        'parse',
        response.status,
        'API 응답을 읽을 수 없어요.',
        error,
      );
    }
  }

  return {
    request,
    getHealth() {
      return request<HealthResponse>(API_ENDPOINTS.health.path, {
        method: API_ENDPOINTS.health.method,
      });
    },
    loginWithToss(loginRequest) {
      return request<TossLoginResponse>(API_ENDPOINTS.tossLogin.path, {
        method: API_ENDPOINTS.tossLogin.method,
        body: JSON.stringify(loginRequest),
      });
    },
    getSession() {
      return request<SessionResponse>(API_ENDPOINTS.session.path, {
        method: API_ENDPOINTS.session.method,
      });
    },
    getTodayProgress() {
      return request<TodayProgressResponse>(API_ENDPOINTS.meToday.path, {
        method: API_ENDPOINTS.meToday.method,
      });
    },
    submitQuiz(submitRequest) {
      return request<SubmitQuizResponse>(API_ENDPOINTS.submitQuiz.path, {
        method: API_ENDPOINTS.submitQuiz.method,
        body: JSON.stringify(submitRequest),
      });
    },
    getSubmissionResult(submissionId, resultRequest = {}) {
      return request<SubmissionResultResponse>(
        API_ENDPOINTS.submissionResult.path.replace(
          ':submissionId',
          encodeURIComponent(submissionId),
        ),
        {
          method: API_ENDPOINTS.submissionResult.method,
          body: JSON.stringify(resultRequest),
        },
      );
    },
    requestTossPoint(rewardRequest) {
      return request<TossPointRewardResponse>(
        API_ENDPOINTS.tossPointReward.path,
        {
          method: API_ENDPOINTS.tossPointReward.method,
          body: JSON.stringify(rewardRequest),
        },
      );
    },
  };
}

export class ApiError extends Error {
  constructor(
    readonly kind: ApiFailureKind,
    readonly status: number,
    message: string,
    readonly cause?: unknown,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function createApiError(response: Response): Promise<ApiError> {
  const body = await readErrorBody(response);
  const message =
    body?.error.message ?? `API 요청에 실패했어요. (${response.status})`;

  return new ApiError(
    classifyFailure(response.status),
    response.status,
    message,
    undefined,
    body?.error.code,
  );
}

async function readErrorBody(
  response: Response,
): Promise<ApiErrorResponse | undefined> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;

    if (
      typeof body.error?.code === 'string' &&
      typeof body.error.message === 'string'
    ) {
      return body as ApiErrorResponse;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function classifyFailure(status: number): ApiFailureKind {
  if (status === 401) {
    return 'auth_required';
  }

  if (status === 403) {
    return 'forbidden';
  }

  if (status === 404) {
    return 'not_found';
  }

  if (status === 400 || status === 422) {
    return 'validation';
  }

  if (status === 409) {
    return 'conflict';
  }

  if (status === 501) {
    return 'not_implemented';
  }

  if (status === 502) {
    return 'external_service';
  }

  if (status >= 500) {
    return 'server';
  }

  return 'unknown';
}

function buildApiUrl(baseUrl: string, path: string): string {
  if (baseUrl.endsWith('/api') && path.startsWith('/api/')) {
    return `${baseUrl}${path.slice('/api'.length)}`;
  }

  return `${baseUrl}${path}`;
}
