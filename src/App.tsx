import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { AppScreen } from './routes';
import type { AnswerResultResponse } from './services/apiClient';
import { initializeTossBannerAds } from './integrations/tossBannerAds';

type AnswerResultState = AnswerResultResponse & {
  quizDate: string;
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [answerResult, setAnswerResult] = useState<AnswerResultState | null>(null);

  useEffect(() => {
    void initializeTossBannerAds();
  }, []);

  function showAnswerResult(result: AnswerResultResponse, quizDate: string) {
    setAnswerResult({
      ...result,
      quizDate,
    });
    setScreen('result');
  }

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen onEnterQuiz={() => setScreen('quiz')} onAnswerResult={showAnswerResult} />}
      {screen === 'quiz' && (
        <QuizScreen
          onAnswerResult={showAnswerResult}
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
