import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { collections } from '../domain/collections.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';
import { getKstDateString } from '../utils/kstDate.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up';
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`;

if (getApps().length === 0) {
  initializeApp({ projectId, storageBucket });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const quizDate = getKstDateString();
const audioStoragePath = `quiz-audio/${quizDate}/sample.mp3`;
const quizSnapshot = await db.collection(collections.quizzes).doc(quizDate).get();

if (!quizSnapshot.exists) {
  throw new Error(`Missing sample quiz: ${collections.quizzes}/${quizDate}`);
}

const quiz = quizSnapshot.data();
const requiredFields = [
  'quizDate',
  'isPublished',
  'audioStoragePath',
  'choices',
  'correctChoiceIds',
  'script',
  'promotionAmount',
];

for (const field of requiredFields) {
  if (quiz?.[field] == null) {
    throw new Error(`Missing sample quiz field: ${field}`);
  }
}

if (quiz?.quizDate !== quizDate) {
  throw new Error(`Sample quiz date mismatch: ${quiz?.quizDate}`);
}

if (quiz?.audioStoragePath !== audioStoragePath) {
  throw new Error('Sample quiz audio path mismatch.');
}

if (!Array.isArray(quiz?.choices) || quiz.choices.length !== sampleQuiz.choices.length) {
  throw new Error('Sample quiz choices do not match the fixture shape.');
}

const [audioExists] = await bucket.file(audioStoragePath).exists();

if (!audioExists) {
  throw new Error('Missing sample storage object.');
}

console.log(`Verified ${collections.quizzes}/${quizDate}`);
console.log(`Verified sample audio object in ${storageBucket}.`);
console.log('Public quiz response fields: quizDate, audioUrl, choices');
console.log('Verified server-only quiz fields remain outside the public response.');
