import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { collections } from '../domain/collections.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up-dev';
const storageBucket = `${projectId}.appspot.com`;

if (getApps().length === 0) {
  initializeApp({ projectId, storageBucket });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const quizSnapshot = await db.collection(collections.quizzes).doc(sampleQuiz.quizDate).get();

if (!quizSnapshot.exists) {
  throw new Error(`Missing sample quiz: ${collections.quizzes}/${sampleQuiz.quizDate}`);
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

const [audioExists] = await bucket.file(sampleQuiz.audioStoragePath).exists();

if (!audioExists) {
  throw new Error(`Missing sample storage object: ${sampleQuiz.audioStoragePath}`);
}

console.log(`Verified ${collections.quizzes}/${sampleQuiz.quizDate}`);
console.log(`Verified gs://${storageBucket}/${sampleQuiz.audioStoragePath}`);
console.log('Public quiz response fields: quizDate, audioUrl, choices');
console.log('Server-only quiz fields: correctChoiceIds, script, promotionAmount, audioStoragePath');
