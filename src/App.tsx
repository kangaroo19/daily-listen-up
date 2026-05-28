import { Button } from '@toss/tds-mobile';
import { useMemo, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import type { AppScreen } from './routes';

const screenOrder: AppScreen[] = ['home', 'quiz', 'result'];

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const currentIndex = screenOrder.indexOf(screen);
  const nextScreen = useMemo(() => screenOrder[(currentIndex + 1) % screenOrder.length], [currentIndex]);

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen />}
      {screen === 'quiz' && <QuizScreen />}
      {screen === 'result' && <ResultScreen />}

      <nav className="screen-nav" aria-label="화면 전환">
        {screenOrder.map((targetScreen) => (
          <Button
            key={targetScreen}
            size="small"
            variant={targetScreen === screen ? 'fill' : 'weak'}
            display="full"
            onClick={() => setScreen(targetScreen)}
          >
            {targetScreen === 'home' ? '홈' : targetScreen === 'quiz' ? '문제' : '결과'}
          </Button>
        ))}
      </nav>

      <Button display="full" onClick={() => setScreen(nextScreen)}>
        다음
      </Button>
    </main>
  );
}
