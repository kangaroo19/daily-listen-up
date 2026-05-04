import type {
  PromotionStatus,
  TodayProgressStatus,
} from '../../../shared/api/contracts.js';

export type Quiz = {
  quizDate: string;
  quizId: string;
  choices: string[];
  correctChoiceIndex: number;
};

export type SessionRecord = {
  sessionId: string;
  userKey: string;
  expiresAt: number;
};

export type ProgressRecord = {
  userKey: string;
  quizDate: string;
  status: TodayProgressStatus;
  attemptCount: number;
  hasEarnedRetry: boolean;
  isPromotionGranted: boolean;
  promotionStatus: PromotionStatus;
  quizId?: string;
};

export type SubmissionRecord = {
  submissionId: string;
  userKey: string;
  quizDate: string;
  quizId: string;
  choiceIndex: number;
  isCorrect: boolean;
  interstitialAdCompleted: boolean;
  createdAt: number;
};

export type AppRepository = {
  saveSession(session: SessionRecord): Promise<void>;
  findSession(sessionId: string): Promise<SessionRecord | undefined>;
  findQuizByDate(quizDate: string): Promise<Quiz | undefined>;
  findQuizById(quizId: string): Promise<Quiz | undefined>;
  findProgress(
    userKey: string,
    quizDate: string,
  ): Promise<ProgressRecord | undefined>;
  saveProgress(progress: ProgressRecord): Promise<void>;
  findSubmissionByUserQuiz(
    userKey: string,
    quizDate: string,
    quizId: string,
  ): Promise<SubmissionRecord | undefined>;
  findSubmission(submissionId: string): Promise<SubmissionRecord | undefined>;
  saveSubmission(submission: SubmissionRecord): Promise<void>;
};
