import { createHash } from 'node:crypto'

import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'

import {
  FIRESTORE_COLLECTIONS,
  type AppSessionDocument,
  type UserDocument,
  type UserProgressDocument,
} from '../firebase/collections'
import { getFirebaseFirestore } from '../firebase/admin'
import { hashSessionToken } from './session'

export type AppSessionResult = {
  userId: string
  sessionToken: string
  expiresAt: Date
}

export type CreateSessionForTossUserInput = {
  userKey: string
  now: Date
  sessionToken: string
  expiresAt: Date
}

export type UserSessionRepository = {
  createSessionForTossUser(input: CreateSessionForTossUserInput): Promise<AppSessionResult>
}

export type CurrentSession = {
  userId: string
  expiresAt: Date
}

export type StoredUserResult = UserDocument & {
  id: string
}

export type FindUserProgressInput = {
  userId: string
  quizDate: string
}

export type CurrentSessionRepository = {
  findSessionByToken(sessionToken: string): Promise<CurrentSession | null>
  findUserById(userId: string): Promise<StoredUserResult | null>
  findUserProgress(
    input: FindUserProgressInput,
  ): Promise<UserProgressDocument | null>
}

type StoredUser = UserDocument & {
  id: string
}

type StoredSession = AppSessionDocument & {
  id: string
}

export class FirestoreUserSessionRepository implements UserSessionRepository {
  constructor(private readonly firestore: Firestore = getFirebaseFirestore()) {}

  async createSessionForTossUser(input: CreateSessionForTossUserInput): Promise<AppSessionResult> {
    const userId = createInternalUserId(input.userKey)
    const userRef = this.firestore.collection(FIRESTORE_COLLECTIONS.users).doc(userId)
    const sessionRef = this.firestore
      .collection(FIRESTORE_COLLECTIONS.appSessions)
      .doc(hashSessionToken(input.sessionToken))
    const nowTimestamp = Timestamp.fromDate(input.now)

    await this.firestore.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef)

      if (userSnapshot.exists) {
        transaction.update(userRef, {
          lastLoginAt: nowTimestamp,
        } satisfies Partial<UserDocument>)
      } else {
        transaction.set(userRef, {
          userKey: input.userKey,
          createdAt: nowTimestamp,
          lastLoginAt: nowTimestamp,
        } satisfies UserDocument)
      }

      transaction.set(sessionRef, {
        userId,
        expiresAt: Timestamp.fromDate(input.expiresAt),
        createdAt: nowTimestamp,
      } satisfies AppSessionDocument)
    })

    return {
      userId,
      sessionToken: input.sessionToken,
      expiresAt: input.expiresAt,
    }
  }
}

export class FirestoreCurrentSessionRepository implements CurrentSessionRepository {
  constructor(private readonly firestore: Firestore = getFirebaseFirestore()) {}

  async findSessionByToken(
    sessionToken: string,
  ): Promise<CurrentSession | null> {
    const sessionSnapshot = await this.firestore
      .collection(FIRESTORE_COLLECTIONS.appSessions)
      .doc(hashSessionToken(sessionToken))
      .get()

    if (!sessionSnapshot.exists) {
      return null
    }

    const session = sessionSnapshot.data() as AppSessionDocument

    return {
      userId: session.userId,
      expiresAt: session.expiresAt.toDate(),
    }
  }

  async findUserById(userId: string): Promise<StoredUserResult | null> {
    const userSnapshot = await this.firestore
      .collection(FIRESTORE_COLLECTIONS.users)
      .doc(userId)
      .get()

    if (!userSnapshot.exists) {
      return null
    }

    return {
      id: userSnapshot.id,
      ...(userSnapshot.data() as UserDocument),
    }
  }

  async findUserProgress(
    input: FindUserProgressInput,
  ): Promise<UserProgressDocument | null> {
    const progressSnapshot = await this.firestore
      .collection(FIRESTORE_COLLECTIONS.userProgress)
      .where('userId', '==', input.userId)
      .where('quizDate', '==', input.quizDate)
      .limit(1)
      .get()

    if (progressSnapshot.empty) {
      return null
    }

    return progressSnapshot.docs[0].data() as UserProgressDocument
  }
}

export class InMemoryUserSessionRepository implements UserSessionRepository, CurrentSessionRepository {
  readonly users: StoredUser[] = []
  readonly sessions: StoredSession[] = []
  readonly userProgress: UserProgressDocument[] = []

  async createSessionForTossUser(input: CreateSessionForTossUserInput): Promise<AppSessionResult> {
    const userId = createInternalUserId(input.userKey)
    const nowTimestamp = Timestamp.fromDate(input.now)
    const existingUser = this.users.find((user) => user.id === userId)

    if (existingUser == null) {
      this.users.push({
        id: userId,
        userKey: input.userKey,
        createdAt: nowTimestamp,
        lastLoginAt: nowTimestamp,
      })
    } else {
      existingUser.lastLoginAt = nowTimestamp
    }

    this.sessions.push({
      id: hashSessionToken(input.sessionToken),
      userId,
      expiresAt: Timestamp.fromDate(input.expiresAt),
      createdAt: nowTimestamp,
    })

    return {
      userId,
      sessionToken: input.sessionToken,
      expiresAt: input.expiresAt,
    }
  }

  async findSessionByToken(
    sessionToken: string,
  ): Promise<CurrentSession | null> {
    const session = this.sessions.find(
      (storedSession) => storedSession.id === hashSessionToken(sessionToken),
    )

    if (session == null) {
      return null
    }

    return {
      userId: session.userId,
      expiresAt: session.expiresAt.toDate(),
    }
  }

  async findUserById(userId: string): Promise<StoredUserResult | null> {
    return this.users.find((user) => user.id === userId) ?? null
  }

  async findUserProgress(
    input: FindUserProgressInput,
  ): Promise<UserProgressDocument | null> {
    return (
      this.userProgress.find(
        (progress) =>
          progress.userId === input.userId &&
          progress.quizDate === input.quizDate,
      ) ?? null
    )
  }
}

function createInternalUserId(userKey: string) {
  const userKeyHash = createHash('sha256').update(userKey).digest('hex').slice(0, 32)
  return `user_${userKeyHash}`
}
