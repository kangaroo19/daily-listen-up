import { findPublishedQuizByDate } from '../repositories/quizRepository.js';
import { createAudioUrl } from './storageBoundary.js';
import { toPublicTodayQuiz } from './quizPublic.js';
import { requireAppSession } from './sessionBoundary.js';
import { getKstDateString } from '../utils/kstDate.js';
import type { PublicTodayQuiz, Quiz } from '../domain/models.js';
import type { AppSessionContext } from './sessionBoundary.js';

export type TodayQuizDependencies = {
  requireAppSession(token: string): Promise<AppSessionContext>;
  getTodayDateString(): string;
  findPublishedQuizByDate(quizDate: string): Promise<Quiz | null>;
  createAudioUrl(input: { quizDate: string; requestBaseUrl: string }): Promise<string>;
};

const defaultDependencies: TodayQuizDependencies = {
  requireAppSession,
  getTodayDateString: getKstDateString,
  findPublishedQuizByDate,
  createAudioUrl,
};

export async function getPublicTodayQuiz(
  token: string,
  requestBaseUrl: string,
  dependencies: TodayQuizDependencies = defaultDependencies,
): Promise<PublicTodayQuiz | null> {
  await dependencies.requireAppSession(token);

  const quiz = await dependencies.findPublishedQuizByDate(dependencies.getTodayDateString());

  if (quiz == null) {
    return null;
  }

  const audioUrl = await dependencies.createAudioUrl({
    quizDate: quiz.quizDate,
    requestBaseUrl,
  });

  return toPublicTodayQuiz(quiz, audioUrl);
}
