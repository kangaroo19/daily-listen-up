import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { findUserProgress } from '../repositories/userProgressRepository.js';
import { createAudioUrl } from './storageBoundary.js';
import { toPublicTodayQuiz } from './quizPublic.js';
import { requireAppSession } from './sessionBoundary.js';
import { getKstDateString } from '../utils/kstDate.js';
import type { PublicTodayQuiz, Quiz, UserProgress } from '../domain/models.js';
import type { AppSessionContext } from './sessionBoundary.js';

export type TodayQuizDependencies = {
  requireAppSession(token: string): Promise<AppSessionContext>;
  getTodayDateString(): string;
  findPublishedQuizByDate(quizDate: string): Promise<Quiz | null>;
  findUserProgress(userId: string, quizDate: string): Promise<UserProgress | null>;
  createAudioUrl(input: { quizDate: string; requestBaseUrl: string }): Promise<string>;
};

const defaultDependencies: TodayQuizDependencies = {
  requireAppSession,
  getTodayDateString: getKstDateString,
  findPublishedQuizByDate,
  findUserProgress,
  createAudioUrl,
};

export class TodayQuizAccessError extends Error {
  constructor(
    message: string,
    public readonly code: 'entry_not_allowed',
  ) {
    super(message);
  }
}

export async function getPublicTodayQuiz(
  token: string,
  requestBaseUrl: string,
  dependencies: TodayQuizDependencies = defaultDependencies,
): Promise<PublicTodayQuiz | null> {
  const session = await dependencies.requireAppSession(token);
  const quizDate = dependencies.getTodayDateString();
  const progress = await dependencies.findUserProgress(session.userId, quizDate);

  if (progress?.progressStatus === 'completed') {
    throw new TodayQuizAccessError('Today quiz entry is not allowed for completed progress.', 'entry_not_allowed');
  }

  const quiz = await dependencies.findPublishedQuizByDate(quizDate);

  if (quiz == null) {
    return null;
  }

  const audioUrl = await dependencies.createAudioUrl({
    quizDate: quiz.quizDate,
    requestBaseUrl,
  });

  return toPublicTodayQuiz(quiz, audioUrl);
}
