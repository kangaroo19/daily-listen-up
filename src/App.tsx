import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { AppScreen } from './routes';
import type { AnswerResultResponse } from './services/apiClient';

type AnswerResultState = AnswerResultResponse & {
  quizDate: string;
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [answerResult, setAnswerResult] = useState<AnswerResultState | null>(null);

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen onEnterQuiz={() => setScreen('quiz')} />}
      {screen === 'quiz' && (
        <QuizScreen
          onAnswerResult={(result, quizDate) => {
            setAnswerResult({
              ...result,
              quizDate,
            });
            setScreen('result');
          }}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          answerResult={answerResult}
          onRetry={() => {
            setAnswerResult(null);
            setScreen('quiz');
          }}
          onHome={() => {
            setAnswerResult(null);
            setScreen('home');
          }}
        />
      )}
    </main>
  );
}
