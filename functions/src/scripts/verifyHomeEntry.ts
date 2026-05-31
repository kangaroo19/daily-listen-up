import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { AppSession, Quiz, UserProgress } from '../domain/models.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';
import { createAppSessionToken, hashAppSessionToken } from '../services/loginSession.js';
import { getKstDateString } from '../utils/kstDate.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up-dev';
const functionBaseUrl = `http://127.0.0.1:5001/${projectId}/asia-northeast3/api/api`;

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const db = getFirestore();
const quizDate = getKstDateString();
const token = createAppSessionToken();
const sessionTokenId = hashAppSessionToken(token);
const userId = 'verify_home_entry_user';
const quizRef = db.collection(collections.quizzes).doc(quizDate);
const sessionRef = db.collection(collections.appSessions).doc(sessionTokenId);
const progressRef = db.collection(collections.userProgress).doc(`${userId}_${quizDate}`);
const rewardGrantRef = db.collection(collections.rewardGrants).doc(`${userId}_${quizDate}`);

await Promise.all([quizRef.delete(), sessionRef.delete(), progressRef.delete(), rewardGrantRef.delete()]);

try {
  await sessionRef.set({
    sessionTokenId,
    userId,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
  } satisfies AppSession);

  const unauthorized = await requestJson(`${functionBaseUrl}/check-today-quiz`);

  if (unauthorized.status !== 401 || unauthorized.body.code !== 'unauthorized') {
    throw new Error(`Expected unauthorized check-today-quiz response: ${JSON.stringify(unauthorized)}`);
  }

  const noQuiz = await requestJson(`${functionBaseUrl}/check-today-quiz`, token);

  if (noQuiz.status !== 200 || noQuiz.body.hasTodayQuiz !== false) {
    throw new Error(`Expected no today quiz response: ${JSON.stringify(noQuiz)}`);
  }

  await sessionRef.set(
    {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    },
    { merge: true },
  );

  const expiredSession = await requestJson(`${functionBaseUrl}/check-today-quiz`, token);

  if (expiredSession.status !== 401 || expiredSession.body.code !== 'unauthorized') {
    throw new Error(`Expected expired session response: ${JSON.stringify(expiredSession)}`);
  }

  await sessionRef.set(
    {
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
    },
    { merge: true },
  );

  await quizRef.set({
    ...sampleQuiz,
    quizDate,
    isPublished: true,
  } satisfies Quiz);

  const hasQuiz = await requestJson(`${functionBaseUrl}/check-today-quiz`, token);

  if (hasQuiz.status !== 200 || hasQuiz.body.hasTodayQuiz !== true) {
    throw new Error(`Expected today quiz response: ${JSON.stringify(hasQuiz)}`);
  }

  const defaultRewardStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    defaultRewardStatus.status !== 200 ||
    defaultRewardStatus.body.progressStatus !== 'not_started' ||
    defaultRewardStatus.body.rewardStatus !== 'none'
  ) {
    throw new Error(`Expected default reward status response: ${JSON.stringify(defaultRewardStatus)}`);
  }

  await progressRef.set({
    userId,
    quizDate,
    progressStatus: 'wrong',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-b'],
    isCorrect: false,
    canViewScript: false,
    rewardStatus: 'none',
    rewardReviewRequired: false,
  } satisfies UserProgress);

  const wrongRewardStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    wrongRewardStatus.status !== 200 ||
    wrongRewardStatus.body.progressStatus !== 'wrong' ||
    wrongRewardStatus.body.rewardStatus !== 'none'
  ) {
    throw new Error(`Expected wrong reward status response: ${JSON.stringify(wrongRewardStatus)}`);
  }

  await progressRef.set({
    userId,
    quizDate,
    progressStatus: 'retry_unlocked',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-b'],
    isCorrect: false,
    canViewScript: false,
    rewardStatus: 'none',
    rewardReviewRequired: false,
  } satisfies UserProgress);

  const retryRewardStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    retryRewardStatus.status !== 200 ||
    retryRewardStatus.body.progressStatus !== 'retry_unlocked' ||
    retryRewardStatus.body.rewardStatus !== 'none'
  ) {
    throw new Error(`Expected retry reward status response: ${JSON.stringify(retryRewardStatus)}`);
  }

  await progressRef.set({
    userId,
    quizDate,
    progressStatus: 'completed',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-a'],
    isCorrect: true,
    canViewScript: false,
    rewardStatus: 'failed',
    rewardReviewRequired: true,
  } satisfies UserProgress);

  await rewardGrantRef.set({
    userId,
    quizDate,
    promotionKey: 'verify_home_entry_promotion',
    amount: 10,
    status: 'failed',
  });

  const completedRewardStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    completedRewardStatus.status !== 200 ||
    completedRewardStatus.body.progressStatus !== 'completed' ||
    completedRewardStatus.body.rewardStatus !== 'failed'
  ) {
    throw new Error(`Expected completed reward status response: ${JSON.stringify(completedRewardStatus)}`);
  }

  await rewardGrantRef.set(
    {
      status: 'success',
    },
    { merge: true },
  );

  const completedSuccessStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    completedSuccessStatus.status !== 200 ||
    completedSuccessStatus.body.progressStatus !== 'completed' ||
    completedSuccessStatus.body.rewardStatus !== 'success'
  ) {
    throw new Error(`Expected completed success status response: ${JSON.stringify(completedSuccessStatus)}`);
  }

  await rewardGrantRef.set(
    {
      status: 'pending',
    },
    { merge: true },
  );

  const completedPendingStatus = await requestJson(`${functionBaseUrl}/reward-status`, token);

  if (
    completedPendingStatus.status !== 200 ||
    completedPendingStatus.body.progressStatus !== 'completed' ||
    completedPendingStatus.body.rewardStatus !== 'pending'
  ) {
    throw new Error(`Expected completed pending status response: ${JSON.stringify(completedPendingStatus)}`);
  }

  console.log('Verified GET /api/check-today-quiz unauthorized, empty, and published quiz responses.');
  console.log('Verified GET /api/check-today-quiz expired session response.');
  console.log('Verified GET /api/reward-status default, wrong, retry_unlocked, completed failed, success, and pending responses.');
} finally {
  await Promise.all([quizRef.delete(), sessionRef.delete(), progressRef.delete(), rewardGrantRef.delete()]);
}

async function requestJson(url: string, tokenToSend?: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(url, {
    headers: tokenToSend == null ? undefined : { authorization: `Bearer ${tokenToSend}` },
  });

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}
