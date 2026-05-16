import { describe, expect, it, vi } from 'vitest'

import { TossAuthHttpClient, getTossApiConfig } from './tossClient'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('getTossApiConfig', () => {
  it('uses the default Apps in Toss API base URL', () => {
    expect(getTossApiConfig({})).toEqual({
      baseUrl: 'https://apps-in-toss-api.toss.im',
    })
  })

  it('uses the configured API base URL without a trailing slash', () => {
    expect(
      getTossApiConfig({
        TOSS_API_BASE_URL: 'https://example.com/',
      }),
    ).toEqual({
      baseUrl: 'https://example.com',
    })
  })
})

describe('TossAuthHttpClient', () => {
  it('exchanges an authorization code for Toss tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        resultType: 'SUCCESS',
        success: {
          tokenType: 'Bearer',
          accessToken: 'toss-access-token',
          refreshToken: 'toss-refresh-token',
          expiresIn: 3599,
          scope: 'user_key user_name unexpected_scope',
        },
      }),
    )
    const client = new TossAuthHttpClient({
      baseUrl: 'https://apps-in-toss-api.toss.im',
      fetch: fetchMock,
    })

    await expect(
      client.exchangeAuthorizationCode({
        authorizationCode: 'authorization-code',
        referrer: 'SANDBOX',
      }),
    ).resolves.toEqual({
      tokenType: 'Bearer',
      accessToken: 'toss-access-token',
      refreshToken: 'toss-refresh-token',
      expiresIn: 3599,
      scope: 'user_key user_name unexpected_scope',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorizationCode: 'authorization-code',
          referrer: 'SANDBOX',
        }),
      },
    )
  })

  it('maps invalid_grant token exchange failures', async () => {
    const client = new TossAuthHttpClient({
      baseUrl: 'https://apps-in-toss-api.toss.im',
      fetch: vi.fn().mockResolvedValue(
        jsonResponse({
          error: 'invalid_grant',
        }),
      ),
    })

    await expect(
      client.exchangeAuthorizationCode({
        authorizationCode: 'expired-code',
        referrer: 'DEFAULT',
      }),
    ).rejects.toMatchObject({
      code: 'invalid_grant',
    })
  })

  it('fetches Toss user info with the access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        resultType: 'SUCCESS',
        success: {
          userKey: 443731104,
          scope: 'user_key',
          agreedTerms: ['terms_tag1'],
        },
      }),
    )
    const client = new TossAuthHttpClient({
      baseUrl: 'https://apps-in-toss-api.toss.im',
      fetch: fetchMock,
    })

    await expect(client.fetchUserInfo('toss-access-token')).resolves.toEqual({
      userKey: '443731104',
      scope: 'user_key',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer toss-access-token',
          'Content-Type': 'application/json',
        },
      },
    )
  })

  it('maps Toss user lookup failures', async () => {
    const client = new TossAuthHttpClient({
      baseUrl: 'https://apps-in-toss-api.toss.im',
      fetch: vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse({
            resultType: 'FAIL',
            error: {
              errorCode: 'USER_KEY_NOT_FOUND',
              reason: 'user key not found',
            },
          }),
        ),
      ),
    })

    await expect(client.fetchUserInfo('toss-access-token')).rejects.toMatchObject({
      name: 'TossAuthError',
      code: 'USER_KEY_NOT_FOUND',
    })
  })
})
