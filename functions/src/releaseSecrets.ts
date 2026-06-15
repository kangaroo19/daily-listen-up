import { defineSecret } from 'firebase-functions/params';

export const TOSS_RELEASE_SECRET_NAMES = [
  'TOSS_PROMOTION_CODE',
  'TOSS_MTLS_CERT',
  'TOSS_MTLS_KEY',
] as const;

export const RELEASE_SECRET_NAMES = [...TOSS_RELEASE_SECRET_NAMES] as const;

export const RELEASE_SECRETS = RELEASE_SECRET_NAMES.map((name) => defineSecret(name));
