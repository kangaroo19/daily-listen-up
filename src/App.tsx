import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { AppScreen } from './routes';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen onEnterQuiz={() => setScreen('quiz')} />}
      {screen === 'quiz' && <QuizScreen />}
      {screen === 'result' && <ResultScreen />}
    </main>
  );
}
