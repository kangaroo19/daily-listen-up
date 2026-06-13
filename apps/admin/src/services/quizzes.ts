import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Quiz } from '../types/quiz';

function snapshotToQuiz(snapshot: QuerySnapshot): Quiz[] {
  return snapshot.docs.map((quizDoc) => {
    const data = quizDoc.data() as Quiz;
    return {
      ...data,
      quizDate: data.quizDate || quizDoc.id,
    };
  });
}

export function subscribeToQuizzes(onNext: (quizzes: Quiz[]) => void, onError: (message: string) => void) {
  if (!db) {
    onError('Firebase 환경변수가 없어 퀴즈 목록을 불러올 수 없습니다.');
    return () => undefined;
  }

  const quizzesCollection = collection(db, 'quizzes');

  return onSnapshot(
    query(quizzesCollection, orderBy('quizDate', 'desc')),
    (snapshot) => onNext(snapshotToQuiz(snapshot)),
    (error) => onError(error.code === 'permission-denied' ? '관리자 권한이 없습니다.' : '퀴즈 목록을 불러오지 못했습니다.'),
  );
}

export async function saveQuiz(quiz: Quiz) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 퀴즈를 저장할 수 없습니다.');
  }

  await setDoc(doc(db, 'quizzes', quiz.quizDate), quiz);
}

export async function quizExists(quizDate: string) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 퀴즈를 확인할 수 없습니다.');
  }

  const snapshot = await getDoc(doc(db, 'quizzes', quizDate));
  return snapshot.exists();
}
