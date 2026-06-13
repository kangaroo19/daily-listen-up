import { FormEvent, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigError } from '../config/firebase';

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      return '이메일 또는 비밀번호를 확인하세요.';
    }

    if (error.code === 'auth/user-not-found') {
      return '등록된 관리자 계정을 찾을 수 없습니다.';
    }
  }

  return '로그인에 실패했습니다. 잠시 후 다시 시도하세요.';
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!auth) {
        setErrorMessage(firebaseConfigError);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Daily Listen Up</p>
          <h1>관리자 로그인</h1>
          <p className="login-copy">Firebase Auth 이메일/비밀번호 관리자 계정으로 로그인하세요.</p>
        </div>

        <label>
          이메일
          <input
            autoComplete="email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          비밀번호
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {firebaseConfigError ? <p className="error-message" role="alert">{firebaseConfigError}</p> : null}
        {errorMessage && !firebaseConfigError ? <p className="error-message" role="alert">{errorMessage}</p> : null}

        <button className="primary-button" disabled={isSubmitting || Boolean(firebaseConfigError)} type="submit">
          {isSubmitting ? '로그인 중' : '로그인'}
        </button>

        <p className="security-note">관리자 UID가 Rules allowlist에 없으면 데이터 접근이 거부됩니다.</p>
      </form>
    </main>
  );
}
