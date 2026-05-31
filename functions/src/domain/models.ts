export type Choice = {
  id: string;
  text: string;
};

export type Quiz = {
  quizDate: string;
  isPublished: boolean;
  audioStoragePath: string;
  choices: Choice[];
  correctChoiceIds: string[];
  script: string;
  promotionAmount: number;
};

export type PublicTodayQuiz = {
  quizDate: string;
  audioUrl: string;
  choices: Choice[];
};

export type ProgressStatus = 'not_started' | 'wrong' | 'retry_unlocked' | 'completed';

export type RewardStatus = 'none' | 'pending' | 'success' | 'failed';

export type UserProgress = {
  userId: string;
  quizDate: string;
  progressStatus: ProgressStatus;
  attemptCount: number;
  lastSubmittedChoiceIds: string[];
  isCorrect: boolean;
  canViewScript: boolean;
  rewardStatus: RewardStatus;
  rewardReviewRequired: boolean;
};

export type User = {
  userId: string;
  userKey: string;
  loggedInAt: FirebaseFirestore.Timestamp;
};

export type AppSession = {
  sessionTokenId: string;
  userId: string;
  expiresAt: FirebaseFirestore.Timestamp;
};

export type RewardGrant = {
  userId: string;
  quizDate: string;
  promotionKey: string;
  amount: number;
  status: Exclude<RewardStatus, 'none'>;
};

export type AdRewardEvent = {
  userId: string;
  quizDate: string;
  purpose: 'retry' | 'script';
  userEarnedReward: boolean;
  earnedAt: FirebaseFirestore.Timestamp;
};
