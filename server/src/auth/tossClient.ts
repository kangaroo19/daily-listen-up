type TossAuthEnv = NodeJS.ProcessEnv | Record<string, string | undefined>

export type TossReferrer = 'DEFAULT' | 'SANDBOX'

export type TossTokenResult = {
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string
}

export type TossUserInfo = {
  userKey: string
  scope: string
}

export type TossAuthClient = {
  exchangeAuthorizationCode(input: {
    authorizationCode: string
    referrer: TossReferrer
  }): Promise<TossTokenResult>
  fetchUserInfo(accessToken: string): Promise<TossUserInfo>
}

export type TossApiConfig = {
  baseUrl: string
}

type Fetch = typeof fetch

type TossAuthHttpClientOptions = TossApiConfig & {
  fetch?: Fetch
}

const DEFAULT_TOSS_API_BASE_URL = 'https://apps-in-toss-api.toss.im'

export class TossAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'TossAuthError'
  }
}

export function getTossApiConfig(env: TossAuthEnv): TossApiConfig {
  const configuredBaseUrl = env.TOSS_API_BASE_URL?.trim()

  return {
    baseUrl: removeTrailingSlash(
      configuredBaseUrl != null && configuredBaseUrl.length > 0
        ? configuredBaseUrl
        : DEFAULT_TOSS_API_BASE_URL,
    ),
  }
}

export class TossAuthHttpClient implements TossAuthClient {
  private readonly baseUrl: string
  private readonly fetchImpl: Fetch

  constructor(options: TossAuthHttpClientOptions) {
    this.baseUrl = removeTrailingSlash(options.baseUrl)
    this.fetchImpl = options.fetch ?? fetch
  }

  async exchangeAuthorizationCode(input: {
    authorizationCode: string
    referrer: TossReferrer
  }): Promise<TossTokenResult> {
    const body = await this.requestJson('/api-partner/v1/apps-in-toss/user/oauth2/generate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorizationCode: input.authorizationCode,
        referrer: input.referrer,
      }),
    })

    const success = parseTossSuccess(body)

    return {
      tokenType: readString(success, 'tokenType'),
      accessToken: readString(success, 'accessToken'),
      refreshToken: readString(success, 'refreshToken'),
      expiresIn: readNumber(success, 'expiresIn'),
      scope: readString(success, 'scope'),
    }
  }

  async fetchUserInfo(accessToken: string): Promise<TossUserInfo> {
    const body = await this.requestJson('/api-partner/v1/apps-in-toss/user/oauth2/login-me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const success = parseTossSuccess(body)

    return {
      userKey: String(readStringOrNumber(success, 'userKey')),
      scope: readString(success, 'scope'),
    }
  }

  private async requestJson(path: string, init: RequestInit): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init)
    const body = await response.json().catch(() => {
      throw new TossAuthError('invalid_response', 'Toss API returned invalid JSON')
    })

    if (!response.ok) {
      throw new TossAuthError(String(response.status), 'Toss API request failed')
    }

    return body
  }
}

function parseTossSuccess(body: unknown): Record<string, unknown> {
  if (isRecord(body) && body.error === 'invalid_grant') {
    throw new TossAuthError('invalid_grant', 'Toss authorization code is invalid')
  }

  if (isRecord(body) && isRecord(body.error)) {
    const errorCode = readOptionalString(body.error, 'errorCode') ?? 'toss_error'
    const reason = readOptionalString(body.error, 'reason') ?? 'Toss API returned an error'

    if (errorCode === 'OAUTH_ISSUE_TOKEN_ERROR' && reason.includes('invalid_grant')) {
      throw new TossAuthError('invalid_grant', reason)
    }

    throw new TossAuthError(errorCode, reason)
  }

  if (!isRecord(body) || !isRecord(body.success)) {
    throw new TossAuthError('invalid_response', 'Toss API returned an unexpected response')
  }

  return body.success
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]

  if (typeof value !== 'string' || value.length === 0) {
    throw new TossAuthError('invalid_response', `Toss response is missing ${key}`)
  }

  return value
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function readStringOrNumber(record: Record<string, unknown>, key: string): string | number {
  const value = record[key]

  if ((typeof value !== 'string' || value.length === 0) && typeof value !== 'number') {
    throw new TossAuthError('invalid_response', `Toss response is missing ${key}`)
  }

  return value
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  throw new TossAuthError('invalid_response', `Toss response is missing ${key}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}
