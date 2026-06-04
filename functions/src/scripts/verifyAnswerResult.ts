import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import type { AppSession, Quiz, RewardGrant, User, UserProgress } from '../domain/models.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';
import { createAppSessionToken, hashAppSessionToken } from '../services/loginSession.js';
import { getKstDateString } from '../utils/kstDate.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up';
const functionBaseUrl = `http://127.0.0.1:5001/${projectId}/asia-northeast3/api/api`;

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const db = getFirestore();
const quizDate = getKstDateString();
const token = createAppSessionToken();
const sessionTokenId = hashAppSessionToken(token);
const userId = 'verify_answer_result_user';
const quizRef = db.collection(collections.quizzes).doc(quizDate);
const sessionRef = db.collection(collections.appSessions).doc(sessionTokenId);
const userRef = db.collection(collections.users).doc(userId);
const progressRef = db.collection(collections.userProgress).doc(`${userId}_${quizDate}`);
const rewardGrantRef = db.collection(collections.rewardGrants).doc(`${userId}_${quizDate}`);

await Promise.all([quizRef.delete(), sessionRef.delete(), userRef.delete(), progressRef.delete(), rewardGrantRef.delete()]);

try {
  await sessionRef.set({
    sessionTokenId,
    userId,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
  } satisfies AppSession);
  await userRef.set({
    userId,
    userKey: 'verify_answer_result_toss_user_key',
    loggedInAt: Timestamp.fromDate(new Date()),
  } satisfies User);

  await quizRef.set({
    ...sampleQuiz,
    quizDate,
    isPublished: true,
  } satisfies Quiz);

  const unauthorized = await postAnswerResult(['choice-b', 'choice-e']);

  if (unauthorized.status !== 401 || unauthorized.body.code !== 'unauthorized') {
    throw new Error(`Expected unauthorized answer-result response: ${JSON.stringify(unauthorized)}`);
  }

  await rewardGrantRef.set({
    userId,
    quizDate,
    promotionKey: 'existing_promotion_key',
    amount: sampleQuiz.promotionAmount,
    status: 'success',
  } satisfies RewardGrant);

  const firstCorrect = await postAnswerResult(['choice-b', 'choice-e'], token);

  if (
    firstCorrect.status !== 200 ||
    firstCorrect.body.isCorrect !== true ||
    firstCorrect.body.progressStatus !== 'completed' ||
    firstCorrect.body.rewardStatus !== 'success'
  ) {
    throw new Error(`Expected first correct answer-result response: ${JSON.stringify(firstCorrect)}`);
  }

  assertPublicAnswerResultBody(firstCorrect.body);
  await assertProgress({ progressStatus: 'completed', rewardStatus: 'success', isCorrect: true, attemptCount: 1 });

  await progressRef.delete();

  const firstWrong = await postAnswerResult(['choice-b'], token);

  if (
    firstWrong.status !== 200 ||
    firstWrong.body.isCorrect !== false ||
    firstWrong.body.progressStatus !== 'wrong' ||
    firstWrong.body.rewardStatus !== 'none'
  ) {
    throw new Error(`Expected first wrong answer-result response: ${JSON.stringify(firstWrong)}`);
  }

  assertPublicAnswerResultBody(firstWrong.body);
  await assertProgress({ progressStatus: 'wrong', rewardStatus: 'none', isCorrect: false, attemptCount: 1 });

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

  const retryCorrect = await postAnswerResult(['choice-e', 'choice-b'], token);

  if (
    retryCorrect.status !== 200 ||
    retryCorrect.body.isCorrect !== true ||
    retryCorrect.body.progressStatus !== 'completed' ||
    retryCorrect.body.rewardStatus !== 'success'
  ) {
    throw new Error(`Expected retry correct answer-result response: ${JSON.stringify(retryCorrect)}`);
  }

  await assertProgress({ progressStatus: 'completed', rewardStatus: 'success', isCorrect: true, attemptCount: 2 });

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

  const retryWrong = await postAnswerResult(['choice-b'], token);

  if (
    retryWrong.status !== 200 ||
    retryWrong.body.isCorrect !== false ||
    retryWrong.body.progressStatus !== 'wrong' ||
    retryWrong.body.rewardStatus !== 'none'
  ) {
    throw new Error(`Expected retry wrong answer-result response: ${JSON.stringify(retryWrong)}`);
  }

  await assertProgress({ progressStatus: 'wrong', rewardStatus: 'none', isCorrect: false, attemptCount: 2 });

  const rejectedWrong = await postAnswerResult(['choice-b', 'choice-e'], token);

  if (rejectedWrong.status !== 409 || rejectedWrong.body.code !== 'submission_not_allowed') {
    throw new Error(`Expected wrong status rejection: ${JSON.stringify(rejectedWrong)}`);
  }

  await progressRef.set({
    userId,
    quizDate,
    progressStatus: 'completed',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-b', 'choice-e'],
    isCorrect: true,
    canViewScript: false,
    rewardStatus: 'none',
    rewardReviewRequired: false,
  } satisfies UserProgress);

  const rejectedCompleted = await postAnswerResult(['choice-b', 'choice-e'], token);

  if (rejectedCompleted.status !== 409 || rejectedCompleted.body.code !== 'submission_not_allowed') {
    throw new Error(`Expected completed status rejection: ${JSON.stringify(rejectedCompleted)}`);
  }

  const partialAnswer = await postAnswerResult(['choice-b'], token);

  if (partialAnswer.status !== 409 || partialAnswer.body.code !== 'submission_not_allowed') {
    throw new Error(`Expected completed status to reject partial answer before grading: ${JSON.stringify(partialAnswer)}`);
  }

  await progressRef.delete();

  const duplicateAnswer = await postAnswerResult(['choice-b', 'choice-b'], token);

  if (duplicateAnswer.status !== 200 || duplicateAnswer.body.isCorrect !== false || duplicateAnswer.body.progressStatus !== 'wrong') {
    throw new Error(`Expected duplicate selected choice IDs to grade as wrong: ${JSON.stringify(duplicateAnswer)}`);
  }

  console.log('Verified POST /api/answer-result unauthorized, not_started, retry_unlocked, wrong, and completed cases.');
  console.log('Verified exact answer matching, retry consumption by status transition, and wrong/completed progress writes.');
  console.log('Verified POST /api/answer-result response exposes only isCorrect, progressStatus, and rewardStatus.');
} finally {
  await Promise.all([quizRef.delete(), sessionRef.delete(), userRef.delete(), progressRef.delete(), rewardGrantRef.delete()]);
}

async function postAnswerResult(
  selectedChoiceIds: string[],
  tokenToSend?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${functionBaseUrl}/answer-result`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(tokenToSend == null ? {} : { authorization: `Bearer ${tokenToSend}` }),
    },
    body: JSON.stringify({
      quizDate,
      selectedChoiceIds,
    }),
  });

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function assertPublicAnswerResultBody(body: Record<string, unknown>): void {
  const keys = Object.keys(body).sort();

  if (JSON.stringify(keys) !== JSON.stringify(['isCorrect', 'progressStatus', 'rewardStatus'])) {
    throw new Error(`Unexpected answer-result response keys: ${keys.join(', ')}`);
  }
}

async function assertProgress(expected: {
  progressStatus: UserProgress['progressStatus'];
  rewardStatus: UserProgress['rewardStatus'];
  isCorrect: boolean;
  attemptCount: number;
}): Promise<void> {
  const snapshot = await progressRef.get();
  const progress = snapshot.data() as UserProgress | undefined;

  if (
    progress == null ||
    progress.userId !== userId ||
    progress.quizDate !== quizDate ||
    progress.progressStatus !== expected.progressStatus ||
    progress.rewardStatus !== expected.rewardStatus ||
    progress.isCorrect !== expected.isCorrect ||
    progress.attemptCount !== expected.attemptCount
  ) {
    throw new Error(`Unexpected userProgress: ${JSON.stringify(progress)}`);
  }
}
