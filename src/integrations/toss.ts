import { appLogin } from '@apps-in-toss/web-framework';

export type TossLoginResult = {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
};

export async function requestTossLogin(): Promise<TossLoginResult> {
  const { authorizationCode, referrer } = await appLogin();

  return {
    authorizationCode,
    referrer,
  };
}
