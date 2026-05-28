import type { PublicTodayQuiz, Quiz } from '../domain/models.js';

export function toPublicTodayQuiz(quiz: Quiz, audioUrl: string): PublicTodayQuiz {
  return {
    quizDate: quiz.quizDate,
    audioUrl,
    choices: quiz.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
    })),
  };
}
