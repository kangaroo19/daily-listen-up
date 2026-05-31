import { clientEnv } from '../config/clientEnv';
import type { TossLoginResult } from '../integrations/toss';
import type { AppSession } from './appSession';

export async function postTossLogin(loginResult: TossLoginResult): Promise<AppSession> {
  const response = await fetch(`${clientEnv.apiBaseUrl}/api/login/toss`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      authorizationCode: loginResult.authorizationCode,
      referrer: loginResult.referrer,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create app session.');
  }

  const body = (await response.json()) as Partial<AppSession>;

  if (typeof body.appSessionToken !== 'string' || typeof body.expiresAt !== 'string') {
    throw new Error('Invalid app session response.');
  }

  return {
    appSessionToken: body.appSessionToken,
    expiresAt: body.expiresAt,
  };
}
