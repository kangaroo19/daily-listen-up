import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiBaseUrl, getStorageBucket } from '../api/todayQuiz.js';

test('keeps the mounted function path when creating deployed API base URLs', () => {
  assert.equal(
    getApiBaseUrl({
      protocol: 'https',
      host: 'asia-northeast3-daily-listen-up.cloudfunctions.net',
      originalUrl: '/api/api/today-quiz',
      path: '/api/today-quiz',
    }),
    'https://asia-northeast3-daily-listen-up.cloudfunctions.net/api/api',
  );
});

test('keeps deployed function name when request originalUrl is stripped', () => {
  assert.equal(
    getApiBaseUrl({
      protocol: 'https',
      host: 'asia-northeast3-daily-listen-up.cloudfunctions.net',
      originalUrl: '/api/today-quiz',
      path: '/api/today-quiz',
    }),
    'https://asia-northeast3-daily-listen-up.cloudfunctions.net/api/api',
  );
});

test('keeps the emulator function path when creating local API base URLs', () => {
  assert.equal(
    getApiBaseUrl(
      {
        protocol: 'http',
        host: '127.0.0.1:5001',
        originalUrl: '/daily-listen-up/asia-northeast3/api/api/today-quiz',
        path: '/api/today-quiz',
      },
      {
        FUNCTIONS_EMULATOR: 'true',
        GCLOUD_PROJECT: 'daily-listen-up',
      },
    ),
    'http://127.0.0.1:5001/daily-listen-up/asia-northeast3/api/api',
  );
});

test('uses Firebase config storage bucket in deployed Functions', () => {
  assert.equal(
    getStorageBucket({
      GCLOUD_PROJECT: 'daily-listen-up',
      FIREBASE_CONFIG: JSON.stringify({
        projectId: 'daily-listen-up',
        storageBucket: 'daily-listen-up.firebasestorage.app',
      }),
    }),
    'daily-listen-up.firebasestorage.app',
  );
});

test('allows explicit storage bucket env override', () => {
  assert.equal(
    getStorageBucket({
      GCLOUD_PROJECT: 'daily-listen-up',
      FIREBASE_STORAGE_BUCKET: 'custom-bucket.example',
      FIREBASE_CONFIG: JSON.stringify({
        storageBucket: 'daily-listen-up.firebasestorage.app',
      }),
    }),
    'custom-bucket.example',
  );
});
