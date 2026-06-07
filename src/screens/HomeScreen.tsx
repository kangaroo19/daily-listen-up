import { Button, useToast } from "@toss/tds-mobile";
import { useState } from "react";
import { requestTossLogin } from "../integrations/toss";
import { getCheckTodayQuiz, getRewardStatus, postTossLogin } from "../services/apiClient";
import type { AnswerResultResponse } from "../services/apiClient";
import { startLogin } from "../services/startLogin";

type HomeScreenProps = {
  onEnterQuiz: () => void;
  onAnswerResult: (result: AnswerResultResponse, quizDate: string) => void;
};

export function HomeScreen({ onEnterQuiz, onAnswerResult }: HomeScreenProps) {
  const { openToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  async function handleStartClick() {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    const loginFailureMessage = "로그인을 완료하지 못했어요. 다시 시작해 주세요.";
    const statusFailureMessage = "상태를 확인하지 못했어요. 다시 시도해 주세요.";

    try {
      const appSession = await startLogin({
        requestTossLogin,
        postTossLogin,
      });

      let todayQuiz;

      try {
        todayQuiz = await getCheckTodayQuiz(appSession.appSessionToken);
      } catch {
        openToast(statusFailureMessage);
        return;
      }

      if (!todayQuiz.hasTodayQuiz) {
        openToast("오늘의 문제가 아직 준비되지 않았어요.");
        return;
      }

      let rewardStatus;

      try {
        rewardStatus = await getRewardStatus(appSession.appSessionToken);
      } catch {
        openToast(statusFailureMessage);
        return;
      }

      if (rewardStatus.progressStatus === "completed") {
        openToast(
          rewardStatus.rewardStatus === "failed"
            ? "포인트 지급 확인이 필요해요"
            : "오늘 문제풀이를 완료했습니다",
        );
        return;
      }

      if (rewardStatus.progressStatus === "wrong") {
        onAnswerResult(
          {
            isCorrect: false,
            progressStatus: "wrong",
            rewardStatus: rewardStatus.rewardStatus,
          },
          rewardStatus.quizDate,
        );
        return;
      }

      onEnterQuiz();
    } catch {
      openToast(loginFailureMessage);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <section className="screen">
      <p className="eyebrow">Daily Listen Up</p>
      <h1>오늘의 영어 듣고 포인트 받기</h1>
      <p className="description">
        짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할 수 있어요.
      </p>
      <p className="supporting">하루에 한 문제만 제공돼요.</p>
      <div className="home-bottom-action">
        <Button
          display="full"
          loading={isStarting}
          disabled={isStarting}
          onClick={handleStartClick}
        >
          시작하기
        </Button>
      </div>
    </section>
  );
}
