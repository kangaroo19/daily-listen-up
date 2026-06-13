import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

function sanitizeFileName(fileName: string) {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return normalized.endsWith('.mp3') ? normalized : `${normalized}.mp3`;
}

export function isMp3File(file: File) {
  return file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
}

export function createAudioStoragePath(quizDate: string, fileName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `quiz-audio/${quizDate}/${timestamp}-${sanitizeFileName(fileName)}`;
}

export async function uploadQuizAudio(quizDate: string, file: File) {
  if (!storage) {
    throw new Error('Firebase 환경변수가 없어 오디오를 업로드할 수 없습니다.');
  }

  const storagePath = createAudioStoragePath(quizDate, file.name);
  await uploadBytes(ref(storage, storagePath), file, { contentType: 'audio/mpeg' });
  return storagePath;
}

export async function deleteQuizAudio(storagePath: string) {
  if (!storage) {
    throw new Error('Firebase 환경변수가 없어 기존 오디오를 삭제할 수 없습니다.');
  }

  await deleteObject(ref(storage, storagePath));
}
