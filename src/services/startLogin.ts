import type { TossLoginResult } from '../integrations/toss';
import { saveAppSession, type AppSession } from './appSession';

type StartLoginDependencies = {
  requestTossLogin: () => Promise<TossLoginResult>;
  postTossLogin: (loginResult: TossLoginResult) => Promise<AppSession>;
  saveSession?: (session: AppSession) => void;
};

export async function startLogin({
  requestTossLogin,
  postTossLogin,
  saveSession = saveAppSession,
}: StartLoginDependencies): Promise<AppSession> {
  const loginResult = await requestTossLogin();
  const appSession = await postTossLogin({
    authorizationCode: loginResult.authorizationCode,
    referrer: loginResult.referrer,
  });

  saveSession(appSession);

  return appSession;
}
