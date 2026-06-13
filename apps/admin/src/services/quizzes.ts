import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
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

export async function updateQuizPublication(quizDate: string, isPublished: boolean) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 발행 상태를 변경할 수 없습니다.');
  }

  await updateDoc(doc(db, 'quizzes', quizDate), { isPublished });
}

export async function deleteQuizDocument(quizDate: string) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 퀴즈를 삭제할 수 없습니다.');
  }

  await deleteDoc(doc(db, 'quizzes', quizDate));
}

export async function quizExists(quizDate: string) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 퀴즈를 확인할 수 없습니다.');
  }

  const snapshot = await getDoc(doc(db, 'quizzes', quizDate));
  return snapshot.exists();
}

export async function hasUserProgressForQuiz(quizDate: string) {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 진행 기록을 확인할 수 없습니다.');
  }

  const snapshot = await getDocs(query(collection(db, 'userProgress'), where('quizDate', '==', quizDate), limit(1)));
  return !snapshot.empty;
}
