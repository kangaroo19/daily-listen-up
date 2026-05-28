import { Button } from '@toss/tds-mobile';

export function QuizScreen() {
  return (
    <section className="screen">
      <p className="eyebrow">오늘의 문제</p>
      <h1>오늘의 영어를 들어보세요</h1>
      <p className="description">음성을 끝까지 들은 뒤 문제를 풀 수 있어요.</p>
      <div className="placeholder-box">오디오와 선택지는 05번 작업에서 연결해요.</div>
      <Button display="full" disabled>
        답안 제출
      </Button>
    </section>
  );
}
