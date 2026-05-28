import type { Quiz } from '../domain/models.js';

export const sampleQuiz: Quiz = {
  quizDate: '2026-05-28',
  isPublished: true,
  audioStoragePath: 'quiz-audio/2026-05-28/sample.mp3',
  choices: [
    { id: 'choice-a', text: 'The speaker is ordering coffee.' },
    { id: 'choice-b', text: 'The speaker is asking for directions.' },
    { id: 'choice-c', text: 'The speaker mentions a delayed train.' },
    { id: 'choice-d', text: 'The speaker is booking a hotel room.' },
    { id: 'choice-e', text: 'The speaker talks about tomorrow morning.' },
  ],
  correctChoiceIds: ['choice-b', 'choice-e'],
  script: 'Excuse me, could you tell me how to get to the station tomorrow morning?',
  promotionAmount: 10,
};
