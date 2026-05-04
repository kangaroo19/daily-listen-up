export type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export type AppRuntimeConfig = {
  firebase: FirebaseRuntimeConfig;
  apiBaseUrl: string;
};

const requiredEnv = {
  firebaseApiKey: 'VITE_FIREBASE_API_KEY',
  firebaseAuthDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  firebaseProjectId: 'VITE_FIREBASE_PROJECT_ID',
  firebaseAppId: 'VITE_FIREBASE_APP_ID',
  apiBaseUrl: 'VITE_API_BASE_URL',
} as const;

export function loadAppConfig(): AppRuntimeConfig {
  const env = import.meta.env;

  return {
    firebase: {
      apiKey: readRequiredEnv(env, requiredEnv.firebaseApiKey),
      authDomain: readRequiredEnv(env, requiredEnv.firebaseAuthDomain),
      projectId: readRequiredEnv(env, requiredEnv.firebaseProjectId),
      appId: readRequiredEnv(env, requiredEnv.firebaseAppId),
    },
    apiBaseUrl: readOptionalEnv(env, requiredEnv.apiBaseUrl) ?? '',
  };
}

function readRequiredEnv(env: ImportMetaEnv, key: string): string {
  const value = env[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`필수 환경변수 ${key}가 설정되지 않았어요.`);
  }

  return value;
}

function readOptionalEnv(env: ImportMetaEnv, key: string): string | undefined {
  const value = env[key];

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value;
}
