import { Quiz } from '../types/quiz';

type QuizListProps = {
  errorMessage: string;
  isLoading: boolean;
  onSelect: (quiz: Quiz) => void;
  quizzes: Quiz[];
  selectedQuizDate: string;
};

export function QuizList({ errorMessage, isLoading, onSelect, quizzes, selectedQuizDate }: QuizListProps) {
  return (
    <div className="list-panel" id="quiz">
      <div className="panel-header">
        <h3>날짜별 퀴즈</h3>
        <select aria-label="퀴즈 상태 필터" defaultValue="all">
          <option value="all">전체</option>
          <option value="draft">미발행</option>
          <option value="published">발행</option>
          <option value="unpublished">발행 해제</option>
        </select>
      </div>

      {isLoading ? <p className="panel-message">퀴즈 목록을 불러오는 중입니다.</p> : null}
      {errorMessage ? <p className="error-message" role="alert">{errorMessage}</p> : null}

      <div className="quiz-table" role="table" aria-label="퀴즈 목록">
        <div className="quiz-table-row quiz-table-head" role="row">
          <span role="columnheader">날짜</span>
          <span role="columnheader">상태</span>
          <span role="columnheader">선택지</span>
        </div>
        {quizzes.map((quiz) => (
          <button
            className={`quiz-table-row ${selectedQuizDate === quiz.quizDate ? 'selected' : ''}`}
            key={quiz.quizDate}
            onClick={() => onSelect(quiz)}
            role="row"
            type="button"
          >
            <span role="cell">
              <strong>{quiz.quizDate}</strong>
              <small>{quiz.script.slice(0, 36) || '스크립트 없음'}</small>
            </span>
            <span role="cell">
              <span className={`badge ${quiz.isPublished ? 'success' : 'warning'}`}>
                {quiz.isPublished ? '발행' : '미발행'}
              </span>
            </span>
            <span role="cell">{quiz.choices.length}개</span>
          </button>
        ))}
      </div>

      {!isLoading && quizzes.length === 0 ? <p className="panel-message">등록된 퀴즈가 없습니다.</p> : null}
    </div>
  );
}
