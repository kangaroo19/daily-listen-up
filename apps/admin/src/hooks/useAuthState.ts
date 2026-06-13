import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signed-out'; user: null }
  | { status: 'signed-in'; user: User };

export function useAuthState(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading', user: null });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthState(user ? { status: 'signed-in', user } : { status: 'signed-out', user: null });
    });
  }, []);

  return authState;
}
