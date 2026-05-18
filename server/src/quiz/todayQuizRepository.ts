import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'

import { getFirebaseFirestore } from '../firebase/admin'
import {
  FIRESTORE_COLLECTIONS,
  type QuizDocument,
  type UserProgressDocument,
} from '../firebase/collections'

export type StoredQuizResult = QuizDocument & {
  id: string
}

export type CreateDefaultUserProgressInput = {
  userId: string
  quizDate: string
  now: Date
}

export type TodayQuizRepository = {
  findPublishedQuizzesByDate(quizDate: string): Promise<StoredQuizResult[]>
  findUserProgress(input: {
    userId: string
    quizDate: string
  }): Promise<UserProgressDocument | null>
  createDefaultUserProgress(
    input: CreateDefaultUserProgressInput,
  ): Promise<UserProgressDocument>
}

export class FirestoreTodayQuizRepository implements TodayQuizRepository {
  constructor(private readonly firestore: Firestore = getFirebaseFirestore()) {}

  async findPublishedQuizzesByDate(
    quizDate: string,
  ): Promise<StoredQuizResult[]> {
    const quizSnapshots = await this.firestore
      .collection(FIRESTORE_COLLECTIONS.quizzes)
      .where('quizDate', '==', quizDate)
      .where('isPublished', '==', true)
      .limit(2)
      .get()

    return quizSnapshots.docs.map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as QuizDocument),
    }))
  }

  async findUserProgress(input: {
    userId: string
    quizDate: string
  }): Promise<UserProgressDocument | null> {
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

  async createDefaultUserProgress(
    input: CreateDefaultUserProgressInput,
  ): Promise<UserProgressDocument> {
    const progressRef = this.firestore
      .collection(FIRESTORE_COLLECTIONS.userProgress)
      .doc(`${input.userId}_${input.quizDate}`)
    const updatedAt = Timestamp.fromDate(input.now)
    const progress = createDefaultUserProgressDocument({
      userId: input.userId,
      quizDate: input.quizDate,
      updatedAt,
    })

    await progressRef.create(progress)

    return progress
  }
}

export function createDefaultUserProgressDocument(input: {
  userId: string
  quizDate: string
  updatedAt: FirebaseFirestore.Timestamp
}): UserProgressDocument {
  return {
    userId: input.userId,
    quizDate: input.quizDate,
    attemptCount: 0,
    lastSubmittedChoiceIds: [],
    isCorrect: false,
    canRetry: false,
    canViewScript: false,
    rewardStatus: 'none',
    needsRewardReview: false,
    updatedAt: input.updatedAt,
  }
}
