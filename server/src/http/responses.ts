import type {
  ApiErrorCode,
  ApiErrorResponse,
} from '../../../shared/api/contracts.js';

export function jsonOk<TBody>(body: TBody, init?: ResponseInit): Response {
  return jsonResponse(body, { status: 200, ...init });
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
): Response {
  return jsonResponse<ApiErrorResponse>(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function jsonResponse<TBody>(body: TBody, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}
