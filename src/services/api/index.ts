import {
  API_ENDPOINTS,
  type ApiErrorResponse,
  type HealthResponse,
} from '../../../shared/api/contracts';

export type ApiClient = {
  request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
  getHealth(): Promise<HealthResponse>;
};

type CreateApiClientOptions = {
  baseUrl: string;
};

export type ApiFailureKind =
  | 'network'
  | 'parse'
  | 'auth_required'
  | 'validation'
  | 'not_implemented'
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
  if (status === 401 || status === 403) {
    return 'auth_required';
  }

  if (status === 400 || status === 422) {
    return 'validation';
  }

  if (status === 501) {
    return 'not_implemented';
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
