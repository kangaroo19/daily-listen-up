import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminUser } from '../types/user';

export const usersPageSize = 50;

export type UserPageCursor = QueryDocumentSnapshot<DocumentData> | null;

export type UserPage = {
  firstCursor: UserPageCursor;
  hasNextPage: boolean;
  lastCursor: UserPageCursor;
  users: AdminUser[];
};

function docToUser(userDoc: QueryDocumentSnapshot<DocumentData>): AdminUser {
  const data = userDoc.data() as Partial<AdminUser>;

  return {
    userId: data.userId || userDoc.id,
    userKey: data.userKey || '',
    loggedInAt: data.loggedInAt || null,
  };
}

function snapshotToUserPage(snapshot: QuerySnapshot<DocumentData>): UserPage {
  const pageDocs = snapshot.docs.slice(0, usersPageSize);

  return {
    firstCursor: pageDocs[0] ?? null,
    hasNextPage: snapshot.docs.length > usersPageSize,
    lastCursor: pageDocs[pageDocs.length - 1] ?? null,
    users: pageDocs.map(docToUser),
  };
}

export function getUsersErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'permission-denied') {
    return '관리자 UID allowlist를 확인하세요. 유저 목록 조회 권한이 없습니다.';
  }

  return '유저 목록을 불러오지 못했습니다.';
}

export function maskUserKey(userKey: string) {
  if (userKey.length < 9) {
    return '마스킹됨';
  }

  return `${userKey.slice(0, 4)}****${userKey.slice(-4)}`;
}

export function formatLoggedInAt(loggedInAt: AdminUser['loggedInAt']) {
  if (!loggedInAt) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(loggedInAt.toDate());
}

export async function fetchUsersPage(cursor: UserPageCursor = null): Promise<UserPage> {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 유저 목록을 불러올 수 없습니다.');
  }

  const usersCollection = collection(db, 'users');
  const usersQuery = cursor
    ? query(usersCollection, orderBy('loggedInAt', 'desc'), startAfter(cursor), limit(usersPageSize + 1))
    : query(usersCollection, orderBy('loggedInAt', 'desc'), limit(usersPageSize + 1));

  const snapshot = await getDocs(usersQuery);
  return snapshotToUserPage(snapshot);
}

export async function findUserById(userId: string): Promise<AdminUser | null> {
  if (!db) {
    throw new Error('Firebase 환경변수가 없어 유저를 검색할 수 없습니다.');
  }

  const snapshot = await getDoc(doc(db, 'users', userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<AdminUser>;

  return {
    userId: data.userId || snapshot.id,
    userKey: data.userKey || '',
    loggedInAt: data.loggedInAt || null,
  };
}
