import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../config/firebase';
import { useQuizProgressMap } from '../hooks/useQuizProgressMap';
import { useQuizzes } from '../hooks/useQuizzes';
import { Quiz } from '../types/quiz';
import { QuizEditor } from './QuizEditor';
import { QuizList } from './QuizList';

type AdminDashboardProps = {
  email: string | null;
};

export function AdminDashboard({ email }: AdminDashboardProps) {
  const { quizzes, errorMessage, isLoading } = useQuizzes();
  const progressMap = useQuizProgressMap(quizzes);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const unpublishedCount = quizzes.filter((quiz) => !quiz.isPublished).length;
  const publishedCount = quizzes.filter((quiz) => quiz.isPublished).length;
  const progressCount = quizzes.filter((quiz) => progressMap[quiz.quizDate]).length;

  const summaryItems = [
    { label: '전체 문제', value: `${quizzes.length}건`, tone: 'neutral' },
    { label: '발행', value: `${publishedCount}건`, tone: 'success' },
    { label: '미발행', value: `${unpublishedCount}건`, tone: 'warning' },
    { label: '발행 해제', value: '0건', tone: 'danger' },
    { label: '진행 기록 있음', value: `${progressCount}건`, tone: progressCount > 0 ? 'warning' : 'neutral' },
  ];

  function handleSaved(quiz: Quiz, message: string) {
    setSelectedQuiz(quiz);
    setSaveMessage(message);
  }

  function handleDeleted(message: string) {
    setSelectedQuiz(null);
    setSaveMessage(message);
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="관리자 메뉴">
        <div>
          <p className="eyebrow">Daily Listen Up</p>
          <h1>관리자</h1>
        </div>
        <nav className="nav-list">
          <a className="nav-item active" href="#quiz">
            퀴즈 관리
          </a>
          <a className="nav-item" href="#audio">
            오디오
          </a>
          <a className="nav-item" href="#settings">
            설정
          </a>
        </nav>
      </aside>

      <main className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">운영 대시보드</p>
            <h2>퀴즈 관리</h2>
            <p className="signed-in-user">{email}</p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={() => auth && signOut(auth)} type="button">
              로그아웃
            </button>
            <button className="primary-button" onClick={() => setSelectedQuiz(null)} type="button">
              새 퀴즈
            </button>
          </div>
        </header>

        <section className="notice-bar" role="status">
          Firestore 또는 Storage 요청이 거부되면 관리자 UID allowlist를 확인하세요.
        </section>

        {saveMessage ? <section className="notice-message" role="status">{saveMessage}</section> : null}

        <section className="summary-grid" aria-label="운영 요약">
          {summaryItems.map((item) => (
            <article className="summary-item" key={item.label}>
              <span>{item.label}</span>
              <strong className={`badge ${item.tone}`}>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="workspace" aria-label="퀴즈 편집 작업 영역">
          <QuizList
            errorMessage={errorMessage}
            isLoading={isLoading}
            onSelect={setSelectedQuiz}
            progressMap={progressMap}
            quizzes={quizzes}
            selectedQuizDate={selectedQuiz?.quizDate ?? ''}
          />
          <QuizEditor
            hasProgress={selectedQuiz ? Boolean(progressMap[selectedQuiz.quizDate]) : false}
            onDeleted={handleDeleted}
            onSaved={handleSaved}
            quizzes={quizzes}
            selectedQuiz={selectedQuiz}
          />
        </section>
      </main>
    </div>
  );
}
