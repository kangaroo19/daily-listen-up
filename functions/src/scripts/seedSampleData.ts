import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(currentDir, '../../src/fixtures/sample-audio-placeholder.mp3');
const db = getFirestore();
const bucket = getStorage().bucket();

await db.collection(collections.quizzes).doc(sampleQuiz.quizDate).set(sampleQuiz);

const fixture = await readFile(fixturePath);
await bucket.file(sampleQuiz.audioStoragePath).save(fixture, {
  contentType: 'audio/mpeg',
  resumable: false,
});

console.log(`Seeded ${collections.quizzes}/${sampleQuiz.quizDate}`);
console.log(`Uploaded gs://${storageBucket}/${sampleQuiz.audioStoragePath}`);
