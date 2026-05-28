import { Button } from '@toss/tds-mobile';

export function ResultScreen() {
  return (
    <section className="screen">
      <p className="eyebrow">결과</p>
      <h1>오늘 학습을 완료했어요</h1>
      <p className="description">내일 새로운 문제로 다시 만나요.</p>
      <div className="placeholder-box">정답, 오답, 포인트 상태는 08번 작업에서 연결해요.</div>
      <Button display="full" variant="weak">
        홈으로
      </Button>
    </section>
  );
}
