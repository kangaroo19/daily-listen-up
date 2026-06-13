import { AdminDashboard } from './components/AdminDashboard';
import { LoginScreen } from './components/LoginScreen';
import { useAuthState } from './hooks/useAuthState';

export function App() {
  const authState = useAuthState();

  if (authState.status === 'loading') {
    return (
      <main className="loading-page" aria-live="polite">
        관리자 로그인 상태를 확인하고 있습니다.
      </main>
    );
  }

  if (authState.status === 'signed-out') {
    return <LoginScreen />;
  }

  return <AdminDashboard email={authState.user.email} />;
}
