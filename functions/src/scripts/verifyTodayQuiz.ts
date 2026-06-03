import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { collections } from '../domain/collections.js';
import type { AppSession, Quiz, UserProgress } from '../domain/models.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';
import { createAppSessionToken, hashAppSessionToken } from '../services/loginSession.js';
import { getKstDateString } from '../utils/kstDate.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up-dev';
const storageBucket = `${projectId}.appspot.com`;
const functionBaseUrl = `http://127.0.0.1:5001/${projectId}/asia-northeast3/api/api`;

if (getApps().length === 0) {
  initializeApp({ projectId, storageBucket });
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(currentDir, '../../src/fixtures/sample.mp3');
const db = getFirestore();
const bucket = getStorage().bucket(storageBucket);
const quizDate = getKstDateString();
const token = createAppSessionToken();
const sessionTokenId = hashAppSessionToken(token);
const userId = 'verify_today_quiz_user';
const quizRef = db.collection(collections.quizzes).doc(quizDate);
const sessionRef = db.collection(collections.appSessions).doc(sessionTokenId);
const progressRef = db.collection(collections.userProgress).doc(`${userId}_${quizDate}`);
const audioPath = `quiz-audio/${quizDate}/sample.mp3`;
const audioFile = bucket.file(audioPath);

await Promise.all([quizRef.delete(), sessionRef.delete(), progressRef.delete(), audioFile.delete({ ignoreNotFound: true })]);

try {
  await sessionRef.set({
    sessionTokenId,
    userId,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
  } satisfies AppSession);

  const unauthorized = await requestJson(`${functionBaseUrl}/today-quiz`);

  if (unauthorized.status !== 401 || unauthorized.body.code !== 'unauthorized') {
    throw new Error(`Expected unauthorized today-quiz response: ${JSON.stringify(unauthorized)}`);
  }

  const noQuiz = await requestJson(`${functionBaseUrl}/today-quiz`, token);

  if (noQuiz.status !== 404 || noQuiz.body.code !== 'today_quiz_not_found') {
    throw new Error(`Expected no today quiz response: ${JSON.stringify(noQuiz)}`);
  }

  await sessionRef.set(
    {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    },
    { merge: true },
  );

  const expiredSession = await requestJson(`${functionBaseUrl}/today-quiz`, token);

  if (expiredSession.status !== 401 || expiredSession.body.code !== 'unauthorized') {
    throw new Error(`Expected expired session response: ${JSON.stringify(expiredSession)}`);
  }

  await sessionRef.set(
    {
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
    },
    { merge: true },
  );

  const quiz = {
    ...sampleQuiz,
    quizDate,
    audioStoragePath: audioPath,
    isPublished: true,
  } satisfies Quiz;

  await quizRef.set(quiz);
  await audioFile.save(await readFile(fixturePath), {
    contentType: 'audio/mpeg',
    resumable: false,
  });

  const todayQuiz = await requestJson(`${functionBaseUrl}/today-quiz`, token);

  if (todayQuiz.status !== 200) {
    throw new Error(`Expected today quiz success response: ${JSON.stringify(todayQuiz)}`);
  }

  assertPublicTodayQuizBody(todayQuiz.body);

  const audioUrl = todayQuiz.body.audioUrl as string;
  const audioResponse = await fetch(audioUrl);

  if (audioResponse.status !== 200 || audioResponse.headers.get('content-type')?.startsWith('audio/mpeg') !== true) {
    throw new Error(`Expected playable audio response at ${audioUrl}: ${audioResponse.status} ${audioResponse.headers.get('content-type')}`);
  }

  await progressRef.set({
    userId,
    quizDate,
    progressStatus: 'completed',
    attemptCount: 1,
    lastSubmittedChoiceIds: ['choice-b', 'choice-e'],
    isCorrect: true,
    canViewScript: false,
    rewardStatus: 'success',
    rewardReviewRequired: false,
  } satisfies UserProgress);

  const completedTodayQuiz = await requestJson(`${functionBaseUrl}/today-quiz`, token);

  if (completedTodayQuiz.status !== 409 || completedTodayQuiz.body.code !== 'entry_not_allowed') {
    throw new Error(`Expected completed progress to reject today quiz entry: ${JSON.stringify(completedTodayQuiz)}`);
  }

  console.log('Verified GET /api/today-quiz unauthorized, expired session, empty quiz, and success responses.');
  console.log('Verified GET /api/today-quiz returns only quizDate, audioUrl, and choices.');
  console.log('Verified returned audioUrl is playable and does not expose the original Storage path.');
  console.log('Verified completed progress cannot fetch today quiz content again.');
} finally {
  await Promise.all([quizRef.delete(), sessionRef.delete(), progressRef.delete(), audioFile.delete({ ignoreNotFound: true })]);
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

function assertPublicTodayQuizBody(body: Record<string, unknown>): void {
  const keys = Object.keys(body).sort();

  if (JSON.stringify(keys) !== JSON.stringify(['audioUrl', 'choices', 'quizDate'])) {
    throw new Error(`Unexpected today quiz response keys: ${keys.join(', ')}`);
  }

  if (body.quizDate !== quizDate || typeof body.audioUrl !== 'string' || !Array.isArray(body.choices)) {
    throw new Error(`Invalid today quiz response body: ${JSON.stringify(body)}`);
  }

  if (body.choices.length !== 5) {
    throw new Error(`Expected five choices: ${JSON.stringify(body.choices)}`);
  }

  if (body.audioUrl.includes(audioPath)) {
    throw new Error('audioUrl exposed the original Storage path.');
  }
}
