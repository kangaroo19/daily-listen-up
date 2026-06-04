import http from 'node:http';
import https from 'node:https';
import { getTossMtlsRequestOptions, readTossMtlsConfigFromEnv, type TossMtlsConfig } from './tossMtlsConfig.js';

export type TossReferrer = 'DEFAULT' | 'SANDBOX';

export type TossTokenRequest = {
  authorizationCode: string;
  referrer: TossReferrer;
};

export type TossTokenResponse = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
};

export type TossLoginMeResponse = {
  userKey: string;
  scope: string;
  agreedTerms: string[];
};

export type TossLoginClient = {
  generateToken(request: TossTokenRequest): Promise<TossTokenResponse>;
  getLoginMe(accessToken: string): Promise<TossLoginMeResponse>;
};

type TossSuccessEnvelope<T> = {
  resultType: 'SUCCESS';
  success: T;
};

type TossFailEnvelope = {
  resultType?: 'FAIL';
  error?: string | {
    errorCode?: string;
    reason?: string;
  };
};

const DEFAULT_TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im';

export function createTossLoginClient(
  fetchImpl: typeof fetch = fetch,
  baseUrl = process.env.TOSS_API_BASE_URL ?? DEFAULT_TOSS_API_BASE_URL,
  mtlsConfig = readTossMtlsConfigFromEnv(),
): TossLoginClient {
  return {
    async generateToken(request) {
      const endpoint = `${baseUrl}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`;
      const response =
        mtlsConfig == null
          ? await fetchImpl(endpoint, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify(request),
            })
          : await requestTossJson(endpoint, 'POST', request, mtlsConfig);

      return readTossSuccess<TossTokenResponse>(response, 'Toss token exchange failed');
    },
    async getLoginMe(accessToken) {
      const endpoint = `${baseUrl}/api-partner/v1/apps-in-toss/user/oauth2/login-me`;
      const response =
        mtlsConfig == null
          ? await fetchImpl(endpoint, {
              method: 'GET',
              headers: {
                authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
              },
            })
          : await requestTossJson(endpoint, 'GET', undefined, mtlsConfig, {
              authorization: `Bearer ${accessToken}`,
            });
      const loginMe = await readTossSuccess<Omit<TossLoginMeResponse, 'userKey'> & { userKey: number | string }>(
        response,
        'Toss login-me failed',
      );

      return {
        ...loginMe,
        userKey: String(loginMe.userKey),
      };
    },
  };
}

async function readTossSuccess<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => null)) as TossSuccessEnvelope<T> | TossFailEnvelope | null;

  if (!response.ok || body == null || body.resultType !== 'SUCCESS') {
    const error = body != null && body.resultType !== 'SUCCESS' ? body.error : undefined;
    const reason = typeof error === 'string' ? error : error?.reason ?? error?.errorCode ?? fallbackMessage;
    throw new Error(reason);
  }

  return body.success;
}

function requestTossJson(
  url: string,
  method: 'GET' | 'POST',
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
    const mtlsRequestOptions = getTossMtlsRequestOptions(mtlsConfig);

    requestOptions.cert = mtlsRequestOptions.cert;
    requestOptions.key = mtlsRequestOptions.key;
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
