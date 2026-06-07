import { getApps, initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { routeApi } from './api/routes.js';
import { TOSS_RELEASE_SECRETS } from './releaseSecrets.js';

if (getApps().length === 0) {
  initializeApp();
}

export const api = onRequest(
  {
    region: 'asia-northeast3',
    secrets: TOSS_RELEASE_SECRETS,
  },
  routeApi,
);
