import {
  API_ENDPOINTS,
  RESERVED_API_ENDPOINTS,
  type HealthResponse,
} from '../../../shared/api/contracts.js';
import { logger } from '../logging/logger.js';
import { jsonError, jsonOk } from './responses.js';

export async function handleApiRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return jsonError(404, 'endpoint_not_found', 'API 경로를 찾을 수 없어요.');
    }

    if (
      request.method === API_ENDPOINTS.health.method &&
      url.pathname === API_ENDPOINTS.health.path
    ) {
      return jsonOk<HealthResponse>({ ok: true });
    }

    if (isReservedEndpoint(request.method, url.pathname)) {
      return jsonError(501, 'not_implemented', '아직 구현되지 않은 API예요.');
    }

    return jsonError(404, 'endpoint_not_found', 'API 경로를 찾을 수 없어요.');
  } catch (error) {
    logger.error('api_request_failed', error);
    return jsonError(500, 'server_error', '서버 요청 처리에 실패했어요.');
  }
}

function isReservedEndpoint(method: string, pathname: string): boolean {
  return RESERVED_API_ENDPOINTS.some(
    (endpoint) => endpoint.method === method && endpoint.path === pathname,
  );
}
