import { Button } from '@toss/tds-mobile';

export function HomeScreen() {
  return (
    <section className="screen">
      <p className="eyebrow">Daily Listen Up</p>
      <h1>오늘의 영어 듣고 포인트 받기</h1>
      <p className="description">
        짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할 수 있어요.
      </p>
      <p className="supporting">하루에 한 문제만 제공돼요.</p>
      <Button display="full">시작하기</Button>
    </section>
  );
}
