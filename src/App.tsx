import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { AppScreen } from './routes';
import type { AnswerResultResponse } from './services/apiClient';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [answerResult, setAnswerResult] = useState<AnswerResultResponse | null>(null);

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen onEnterQuiz={() => setScreen('quiz')} />}
      {screen === 'quiz' && (
        <QuizScreen
          onAnswerResult={(result) => {
            setAnswerResult(result);
            setScreen('result');
          }}
        />
      )}
      {screen === 'result' && <ResultScreen answerResult={answerResult} />}
    </main>
  );
}
