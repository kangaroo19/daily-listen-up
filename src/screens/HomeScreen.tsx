import { Asset, Button, Stepper, useToast } from "@toss/tds-mobile";
import { useState } from "react";
import { TossBannerAd } from "../components/TossBannerAd";
import { requestTossLogin } from "../integrations/toss";
import {
  getCheckTodayQuiz,
  getRewardStatus,
  postTossLogin,
} from "../services/apiClient";
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

    const loginFailureMessage =
      "로그인을 완료하지 못했어요. 다시 시작해 주세요.";
    const statusFailureMessage =
      "상태를 확인하지 못했어요. 다시 시도해 주세요.";

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
            : "오늘 문제를 다 풀었어요.",
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
      <div className="home-hero-icon">
        <Asset.Image
          src="https://firebasestorage.googleapis.com/v0/b/daily-listen-up.firebasestorage.app/o/logo.png?alt=media&token=e93ed57f-d0b6-4230-b109-2cc34a58f4ed"
          alt="Daily Listen Up"
          frameShape={{
            width: 88,
            height: 88,
            radius: 28,
          }}
          scaleType="fit"
        />
      </div>
      <Stepper className="home-stepper">
        <Stepper.StepperRow
          left={<Stepper.NumberIcon number={1} />}
          center={
            <Stepper.Texts
              type="C"
              title="짧은 영어 음성 듣기"
              description="하루 한 문제 분량만 가볍게 들어요."
            />
          }
        />
        <Stepper.StepperRow
          left={<Stepper.NumberIcon number={2} />}
          center={
            <Stepper.Texts
              type="C"
              title="정답 맞히고 포인트 확인"
              description="토스 포인트 보상 기회를 확인해요."
            />
          }
          hideLine
        />
      </Stepper>
      <TossBannerAd />
      <div className="home-bottom-action">
        <Button
          display="block"
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
