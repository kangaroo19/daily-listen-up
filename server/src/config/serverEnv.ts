export type ServerEnvKey =
  | 'TOSS_CLIENT_SECRET'
  | 'TOSS_POINT_PROMOTION_SECRET'
  | 'FIREBASE_PROJECT_ID'
  | 'FIREBASE_SERVICE_ACCOUNT_JSON';

export function readRequiredServerEnv(key: ServerEnvKey): string {
  const value = process.env[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`필수 서버 환경변수 ${key}가 설정되지 않았어요.`);
  }

  return value;
}
