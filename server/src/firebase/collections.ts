export const FIRESTORE_COLLECTIONS = {
  quizzes: 'quizzes',
  users: 'users',
  appSessions: 'appSessions',
  userProgress: 'userProgress',
  rewardGrants: 'rewardGrants',
  adRewardEvents: 'adRewardEvents',
} as const

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS]

export type QuizChoice = {
  id: string
  text: string
}

export type QuizDocument = {
  quizDate: string
  isPublished: boolean
  questionText: string
  audioStoragePath: string
  choices: QuizChoice[]
  correctChoiceIds: string[]
  script: string
  promotionAmount: number
}

export type UserDocument = {
  userKey: string
  createdAt: FirebaseFirestore.Timestamp
  lastLoginAt: FirebaseFirestore.Timestamp
}

export type AppSessionDocument = {
  userId: string
  expiresAt: FirebaseFirestore.Timestamp
  createdAt: FirebaseFirestore.Timestamp
}

export type UserProgressDocument = {
  userId: string
  quizDate: string
  attemptCount: number
  lastSubmittedChoiceIds: string[]
  isCorrect: boolean
  canRetry: boolean
  canViewScript: boolean
  rewardStatus: 'none' | 'pending' | 'success' | 'failed'
  needsRewardReview: boolean
  updatedAt: FirebaseFirestore.Timestamp
}

export type RewardGrantDocument = {
  userId: string
  quizDate: string
  promotionKey: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
}

export type AdRewardEventDocument = {
  userId: string
  quizDate: string
  purpose: 'retry' | 'script'
  userEarnedReward: boolean
  createdAt: FirebaseFirestore.Timestamp
}
