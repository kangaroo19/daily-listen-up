import { createHash } from 'node:crypto'

import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'

import { FIRESTORE_COLLECTIONS, type AppSessionDocument, type UserDocument } from '../firebase/collections'
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

export class InMemoryUserSessionRepository implements UserSessionRepository {
  readonly users: StoredUser[] = []
  readonly sessions: StoredSession[] = []

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
}

function createInternalUserId(userKey: string) {
  const userKeyHash = createHash('sha256').update(userKey).digest('hex').slice(0, 32)
  return `user_${userKeyHash}`
}
