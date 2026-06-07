import type { Quiz } from '../domain/models.js';

export const sampleQuiz: Quiz = {
  quizDate: '2026-05-28',
  isPublished: true,
  audioStoragePath: 'quiz-audio/2026-05-28/sample.mp3',
  choices: [
    { id: 'choice-a', text: '화자는 어제 저녁 배달 음식을 기다리고 있었다.' },
    { id: 'choice-b', text: '배달원은 second floor를 second door로 잘못 이해했다.' },
    { id: 'choice-c', text: '배달원은 옆집 생일파티에 샐러드를 들고 들어갔다.' },
    { id: 'choice-d', text: '화자는 잘못 배달된 피자를 직접 돌려받았다.' },
    { id: 'choice-e', text: '옆집 사람들은 화자의 주문을 바로 거절했다.' },
  ],
  correctChoiceIds: ['choice-a', 'choice-b', 'choice-c'],
  script:
    'Hey, you won\'t believe what happened yesterday evening. I ordered a salad because I was trying to be healthy for once. The delivery guy called and asked, "Are you on the second floor?" I said yes, but somehow he heard "second door." So he walked into my neighbor\'s birthday party with my tiny salad, announced, "Dinner is here," and everyone clapped. By the time I opened my door, they had put a candle in the tomatoes and were singing to it. The delivery guy looked more confused than I was.',
  promotionAmount: 5,
};
