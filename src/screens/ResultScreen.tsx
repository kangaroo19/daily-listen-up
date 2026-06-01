import { Button } from '@toss/tds-mobile';
import type { AnswerResultResponse } from '../services/apiClient';

type ResultScreenProps = {
  answerResult: AnswerResultResponse | null;
};

export function ResultScreen({ answerResult }: ResultScreenProps) {
  const title = answerResult?.isCorrect === true ? '정답이에요' : answerResult?.isCorrect === false ? '아쉬워요' : '오늘 학습을 완료했어요';
  const description =
    answerResult?.isCorrect === true
      ? '포인트 보상 상태를 확인해 주세요.'
      : answerResult?.isCorrect === false
        ? '광고를 보고 같은 문제에 다시 도전할 수 있어요.'
        : '내일 새로운 문제로 다시 만나요.';

  return (
    <section className="screen">
      <p className="eyebrow">결과</p>
      <h1>{title}</h1>
      <p className="description">{description}</p>
      <div className="placeholder-box">
        {answerResult == null
          ? '정답, 오답, 포인트 상태는 08번 작업에서 연결해요.'
          : `진행 상태: ${answerResult.progressStatus} / 지급 상태: ${answerResult.rewardStatus}`}
      </div>
      <Button display="full" variant="weak">
        홈으로
      </Button>
    </section>
  );
}
