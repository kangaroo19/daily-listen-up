import { getKstQuizDate } from '../services/date.js';
import type {
  AppRepository,
  ProgressRecord,
  Quiz,
  SessionRecord,
  SubmissionRecord,
} from './types.js';

export class InMemoryRepository implements AppRepository {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly progresses = new Map<string, ProgressRecord>();
  private readonly submissions = new Map<string, SubmissionRecord>();
  private readonly quizzes = new Map<string, Quiz>();

  constructor() {
    const quizDate = getKstQuizDate();
    this.quizzes.set(quizDate, {
      quizDate,
      quizId: `daily-${quizDate}`,
      choices: [
        'I listen every morning.',
        'I listened tomorrow.',
        'I listening now.',
      ],
      correctChoiceIndex: 0,
    });
  }

  async saveSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async findSession(sessionId: string): Promise<SessionRecord | undefined> {
    const session = this.sessions.get(sessionId);

    if (session != null && session.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  async findQuizByDate(quizDate: string): Promise<Quiz | undefined> {
    return this.quizzes.get(quizDate);
  }

  async findQuizById(quizId: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(
      (quiz) => quiz.quizId === quizId,
    );
  }

  async findProgress(
    userKey: string,
    quizDate: string,
  ): Promise<ProgressRecord | undefined> {
    return this.progresses.get(progressKey(userKey, quizDate));
  }

  async saveProgress(progress: ProgressRecord): Promise<void> {
    this.progresses.set(
      progressKey(progress.userKey, progress.quizDate),
      progress,
    );
  }

  async findSubmissionByUserQuiz(
    userKey: string,
    quizDate: string,
    quizId: string,
  ): Promise<SubmissionRecord | undefined> {
    return Array.from(this.submissions.values()).find(
      (submission) =>
        submission.userKey === userKey &&
        submission.quizDate === quizDate &&
        submission.quizId === quizId,
    );
  }

  async findSubmission(
    submissionId: string,
  ): Promise<SubmissionRecord | undefined> {
    return this.submissions.get(submissionId);
  }

  async saveSubmission(submission: SubmissionRecord): Promise<void> {
    this.submissions.set(submission.submissionId, submission);
  }
}

function progressKey(userKey: string, quizDate: string): string {
  return `${userKey}:${quizDate}`;
}

export const appRepository = new InMemoryRepository();
