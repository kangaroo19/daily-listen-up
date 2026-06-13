const summaryItems = [
  { label: '오늘 문제', value: '미발행', tone: 'warning' },
  { label: '내일 문제', value: '준비 전', tone: 'neutral' },
  { label: '미발행', value: '0건', tone: 'neutral' },
  { label: '발행 해제', value: '0건', tone: 'danger' },
  { label: '주의 필요', value: '0건', tone: 'warning' },
];

const quizRows = [
  {
    date: '2026-05-24',
    title: '샘플 퀴즈 자리',
    status: '미발행',
    progress: '진행 기록 없음',
  },
];

export function App() {
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
            오디오/TTS
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
          </div>
          <button className="primary-button" type="button">
            새 퀴즈
          </button>
        </header>

        <section className="summary-grid" aria-label="운영 요약">
          {summaryItems.map((item) => (
            <article className="summary-item" key={item.label}>
              <span>{item.label}</span>
              <strong className={`badge ${item.tone}`}>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="workspace" aria-label="퀴즈 편집 작업 영역">
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
            <div className="quiz-table" role="table" aria-label="퀴즈 목록">
              <div className="quiz-table-row quiz-table-head" role="row">
                <span role="columnheader">날짜</span>
                <span role="columnheader">상태</span>
                <span role="columnheader">진행</span>
              </div>
              {quizRows.map((row) => (
                <button className="quiz-table-row selected" type="button" role="row" key={row.date}>
                  <span role="cell">
                    <strong>{row.date}</strong>
                    <small>{row.title}</small>
                  </span>
                  <span role="cell">
                    <span className="badge warning">{row.status}</span>
                  </span>
                  <span role="cell">{row.progress}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="detail-panel">
            <div className="panel-header">
              <div>
                <h3>퀴즈 상세</h3>
                <p>Firebase 연동 전 정적 편집 뼈대</p>
              </div>
              <span className="badge neutral">저장 전</span>
            </div>

            <section className="form-section">
              <h4>기본 정보</h4>
              <label>
                퀴즈 날짜
                <input type="date" defaultValue="2026-05-24" />
              </label>
              <div className="inline-status">
                <span className="badge warning">미발행</span>
                <span className="badge neutral">진행 기록 없음</span>
              </div>
            </section>

            <section className="form-section">
              <h4>선택지</h4>
              {[1, 2, 3, 4, 5].map((choice) => (
                <label className="choice-row" key={choice}>
                  <input type="checkbox" aria-label={`${choice}번 정답`} />
                  <span>{choice}</span>
                  <input type="text" placeholder={`${choice}번 선택지`} />
                </label>
              ))}
            </section>

            <section className="form-section">
              <h4>스크립트</h4>
              <textarea rows={6} placeholder="듣기 스크립트를 입력하세요." />
            </section>

            <section className="form-section">
              <h4>오디오</h4>
              <div className="audio-actions">
                <button type="button" className="secondary-button">
                  mp3 업로드
                </button>
                <button type="button" className="secondary-button">
                  TTS 미리듣기
                </button>
                <button type="button" className="secondary-button" disabled>
                  이 음성 사용
                </button>
              </div>
            </section>

            <section className="form-section preview-box">
              <h4>미리보기</h4>
              <p>사용자에게 보일 문제 형태가 이 영역에 표시됩니다.</p>
            </section>

            <div className="action-bar">
              <button type="button" className="danger-button">
                삭제
              </button>
              <button type="button" className="secondary-button">
                발행 해제
              </button>
              <button type="button" className="secondary-button">
                저장
              </button>
              <button type="button" className="primary-button">
                발행
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
