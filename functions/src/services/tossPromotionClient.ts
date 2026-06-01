import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';

export type PromotionExecutionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export type TossPromotionClient = {
  createPromotionKey(userKey: string): Promise<string>;
  executePromotion(request: {
    userKey: string;
    promotionCode: string;
    key: string;
    amount: number;
  }): Promise<void>;
  getExecutionResult(request: {
    userKey: string;
    promotionCode: string;
    key: string;
  }): Promise<PromotionExecutionStatus>;
};

type TossSuccessEnvelope<T> = {
  resultType: 'SUCCESS';
  success: T;
};

type TossFailEnvelope = {
  resultType?: 'FAIL';
  error?: {
    errorCode?: string;
    reason?: string;
  };
};

type TossMtlsConfig = {
  certPath: string;
  keyPath: string;
};

const DEFAULT_TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

export function createTossPromotionClient(
  fetchImpl: typeof fetch = fetch,
  baseUrl = process.env.TOSS_API_BASE_URL ?? DEFAULT_TOSS_API_BASE_URL,
  mtlsConfig = readTossMtlsConfigFromEnv(),
): TossPromotionClient {
  return {
    async createPromotionKey(userKey) {
      const endpoint = `${baseUrl}/api-partner/v1/apps-in-toss/promotion/execute-promotion/get-key`;
      const response = await requestPromotionJson(fetchImpl, endpoint, { userKey }, undefined, mtlsConfig);
      const result = await readTossSuccess<{ key: string }>(response, 'Toss promotion key creation failed');

      return result.key;
    },
    async executePromotion(request) {
      const endpoint = `${baseUrl}/api-partner/v1/apps-in-toss/promotion/execute-promotion`;
      const response = await requestPromotionJson(
        fetchImpl,
        endpoint,
        { userKey: request.userKey },
        {
          promotionCode: request.promotionCode,
          key: request.key,
          amount: request.amount,
        },
        mtlsConfig,
      );

      await readTossSuccess<{ key: string }>(response, 'Toss promotion execution failed');
    },
    async getExecutionResult(request) {
      const endpoint = `${baseUrl}/api-partner/v1/apps-in-toss/promotion/execution-result`;
      const response = await requestPromotionJson(
        fetchImpl,
        endpoint,
        { userKey: request.userKey },
        {
          promotionCode: request.promotionCode,
          key: request.key,
        },
        mtlsConfig,
      );

      return readTossSuccess<PromotionExecutionStatus>(response, 'Toss promotion execution result failed');
    },
  };
}

function requestPromotionJson(
  fetchImpl: typeof fetch,
  endpoint: string,
  headers: { userKey: string },
  body: unknown,
  mtlsConfig: TossMtlsConfig | undefined,
): Promise<Response> {
  const extraHeaders = {
    'x-toss-user-key': headers.userKey,
  };

  if (mtlsConfig == null) {
    return fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...extraHeaders,
      },
      body: body == null ? undefined : JSON.stringify(body),
    });
  }

  return requestTossJson(endpoint, 'POST', body, mtlsConfig, extraHeaders);
}

function readTossMtlsConfigFromEnv(): TossMtlsConfig | undefined {
  const certPath = process.env.TOSS_MTLS_CERT_PATH;
  const keyPath = process.env.TOSS_MTLS_KEY_PATH;

  if (certPath == null || keyPath == null) {
    return undefined;
  }

  return {
    certPath,
    keyPath,
  };
}

async function readTossSuccess<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => null)) as TossSuccessEnvelope<T> | TossFailEnvelope | null;

  if (!response.ok || body == null || body.resultType !== 'SUCCESS') {
    const error = body != null && body.resultType !== 'SUCCESS' ? body.error : undefined;
    const reason = error?.reason ?? error?.errorCode ?? fallbackMessage;
    throw new Error(reason);
  }

  return body.success;
}

function requestTossJson(
  url: string,
  method: 'POST',
  body: unknown,
  mtlsConfig: TossMtlsConfig,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const urlObject = new URL(url);
  const requestBody = body == null ? undefined : JSON.stringify(body);
  const headers: Record<string, string | number> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  };

  if (requestBody != null) {
    headers['Content-Length'] = Buffer.byteLength(requestBody);
  }

  const requestModule = urlObject.protocol === 'http:' ? http : https;
  const requestOptions: https.RequestOptions = {
    hostname: urlObject.hostname,
    port: urlObject.port || (urlObject.protocol === 'http:' ? 80 : 443),
    path: `${urlObject.pathname}${urlObject.search}`,
    method,
    headers,
  };

  if (urlObject.protocol === 'https:') {
    requestOptions.cert = readFileSync(mtlsConfig.certPath);
    requestOptions.key = readFileSync(mtlsConfig.keyPath);
    requestOptions.rejectUnauthorized = true;
  }

  return new Promise((resolve, reject) => {
    const req = requestModule.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve(
          new Response(Buffer.concat(chunks), {
            status: res.statusCode,
            headers: res.headers as HeadersInit,
          }),
        );
      });
    });

    req.on('error', reject);

    if (requestBody != null) {
      req.write(requestBody);
    }

    req.end();
  });
}
