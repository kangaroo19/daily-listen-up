import { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { initializeAppRuntime } from './bootstrap';
import type { AppBootState } from './types';
import { HomePage } from '../pages/HomePage';
import { InitFailedView } from '../shared/ui/InitFailedView';
import { LoadingView } from '../shared/ui/LoadingView';

export function App() {
  const [bootState, setBootState] = useState<AppBootState>({
    status: 'bootstrapping',
  });

  useEffect(() => {
    let isMounted = true;

    initializeAppRuntime()
      .then((runtime) => {
        if (isMounted) {
          setBootState({ status: 'ready', runtime });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setBootState({
            status: 'initFailed',
            error:
              error instanceof Error
                ? error
                : new Error('앱 초기화에 실패했어요.'),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell>
      {bootState.status === 'bootstrapping' ? <LoadingView /> : null}
      {bootState.status === 'initFailed' ? (
        <InitFailedView
          error={bootState.error}
          onRetry={() => window.location.reload()}
        />
      ) : null}
      {bootState.status === 'ready' ? (
        <HomePage runtime={bootState.runtime} />
      ) : null}
    </AppShell>
  );
}
