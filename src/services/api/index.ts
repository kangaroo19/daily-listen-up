export type ApiClient = {
  request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
};

type CreateApiClientOptions = {
  baseUrl: string;
};

export function createApiClient({
  baseUrl,
}: CreateApiClientOptions): ApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async request<TResponse>(path, init) {
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(response.status, await readErrorMessage(response));
      }

      return (await response.json()) as TResponse;
    },
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readErrorMessage(response: Response) {
  const fallback = `API 요청에 실패했어요. (${response.status})`;

  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === 'string' ? body.message : fallback;
  } catch {
    return fallback;
  }
}
