import { defineSecret } from 'firebase-functions/params';

export const TOSS_RELEASE_SECRET_NAMES = [
  'TOSS_PROMOTION_CODE',
  'TOSS_MTLS_CERT',
  'TOSS_MTLS_KEY',
] as const;

export const ADMIN_TTS_SECRET_NAMES = [
  'ADMIN_UID_ALLOWLIST',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID_FEMALE',
  'ELEVENLABS_VOICE_ID_MALE',
] as const;

export const RELEASE_SECRET_NAMES = [...TOSS_RELEASE_SECRET_NAMES, ...ADMIN_TTS_SECRET_NAMES] as const;

export const RELEASE_SECRETS = RELEASE_SECRET_NAMES.map((name) => defineSecret(name));
