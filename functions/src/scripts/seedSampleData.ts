import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { collections } from '../domain/collections.js';
import { sampleQuiz } from '../sample/sampleQuiz.js';
import { getKstDateString } from '../utils/kstDate.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up-dev';
const storageBucket = `${projectId}.appspot.com`;

if (getApps().length === 0) {
  initializeApp({ projectId, storageBucket });
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(currentDir, '../../src/fixtures/sample-audio-placeholder.mp3');
const db = getFirestore();
const bucket = getStorage().bucket();
const quizDate = getKstDateString();
const quiz = {
  ...sampleQuiz,
  quizDate,
  audioStoragePath: `quiz-audio/${quizDate}/sample.mp3`,
};

await db.collection(collections.quizzes).doc(quiz.quizDate).set(quiz);

const fixture = await readFile(fixturePath);
await bucket.file(quiz.audioStoragePath).save(fixture, {
  contentType: 'audio/mpeg',
  resumable: false,
});

console.log(`Seeded ${collections.quizzes}/${quiz.quizDate}`);
console.log(`Uploaded gs://${storageBucket}/${quiz.audioStoragePath}`);
