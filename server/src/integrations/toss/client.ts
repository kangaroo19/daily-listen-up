import { AppError } from '../../services/errors.js';

const TOSS_API_BASE_URL =
  process.env.TOSS_API_BASE_URL ?? 'https://apps-in-toss-api.toss.im';

type TossTokenSuccess = {
  resultType: 'SUCCESS';
  success: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
  };
};

type TossLoginMeSuccess = {
  resultType: 'SUCCESS';
  success: {
    userKey: number | string;
  };
};

export class TossClient {
  async exchangeAuthorizationCode(params: {
    authorizationCode: string;
    referrer: 'DEFAULT' | 'SANDBOX';
  }) {
    const response = await fetch(
      `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );

    const body = (await response.json().catch(() => undefined)) as
      | TossTokenSuccess
      | undefined;

    if (!response.ok || body?.resultType !== 'SUCCESS') {
      throw new AppError(
        502,
        'external_service_error',
        '토스 로그인 토큰 발급에 실패했어요.',
      );
    }

    return body.success;
  }

  async fetchUser(accessToken: string) {
    const response = await fetch(
      `${TOSS_API_BASE_URL}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const body = (await response.json().catch(() => undefined)) as
      | TossLoginMeSuccess
      | undefined;

    if (!response.ok || body?.resultType !== 'SUCCESS') {
      throw new AppError(
        502,
        'external_service_error',
        '토스 사용자 정보 조회에 실패했어요.',
      );
    }

    return {
      userKey: String(body.success.userKey),
    };
  }
}

export const tossClient = new TossClient();
