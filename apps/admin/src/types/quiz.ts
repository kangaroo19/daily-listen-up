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

export type QuizFormState = {
  quizDate: string;
  audioStoragePath: string;
  choices: Choice[];
  correctChoiceIds: string[];
  script: string;
  promotionAmount: string;
};

export const defaultChoiceIds = ['choice-a', 'choice-b', 'choice-c', 'choice-d', 'choice-e'] as const;

export function createEmptyQuizForm(quizDate = ''): QuizFormState {
  return {
    quizDate,
    audioStoragePath: '',
    choices: defaultChoiceIds.map((id) => ({ id, text: '' })),
    correctChoiceIds: [],
    script: '',
    promotionAmount: '5',
  };
}

export function quizToFormState(quiz: Quiz): QuizFormState {
  return {
    quizDate: quiz.quizDate,
    audioStoragePath: quiz.audioStoragePath,
    choices: quiz.choices,
    correctChoiceIds: quiz.correctChoiceIds,
    script: quiz.script,
    promotionAmount: String(quiz.promotionAmount),
  };
}
