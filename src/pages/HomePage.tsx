import type { AppRuntime } from '../app/types';

type HomePageProps = {
  runtime: AppRuntime;
};

export function HomePage({ runtime }: HomePageProps) {
  return (
    <section className="home-page" aria-labelledby="home-title">
      <div className="home-page__status">앱 준비 완료</div>
      <h1 id="home-title">Daily Listen Up</h1>
      <p>짧은 영어 듣기 학습을 시작할 수 있는 기본 구조가 준비됐어요.</p>
      <dl className="runtime-list" aria-label="초기화 상태">
        <div>
          <dt>Firebase</dt>
          <dd>{runtime.firebase.projectId}</dd>
        </div>
        <div>
          <dt>Toss 런타임</dt>
          <dd>{runtime.toss.isInTossApp ? '확인됨' : '로컬 브라우저'}</dd>
        </div>
        <div>
          <dt>광고 경계</dt>
          <dd>{runtime.ads.isAvailable ? '사용 가능' : '대기 중'}</dd>
        </div>
      </dl>
    </section>
  );
}
