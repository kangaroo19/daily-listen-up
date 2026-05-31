import { Button } from "@toss/tds-mobile";
import { useToast } from "@toss/tds-mobile";
import { useState } from "react";
import { requestTossLogin } from "../integrations/toss";
import { postTossLogin } from "../services/apiClient";
import { startLogin } from "../services/startLogin";

export function HomeScreen() {
  const { openToast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  async function handleStartClick() {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      await startLogin({
        requestTossLogin,
        postTossLogin,
      });
    } catch {
      const message = "로그인을 완료하지 못했어요. 다시 시작해 주세요.";
      openToast(message);
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
      <Button
        display="full"
        loading={isStarting}
        disabled={isStarting}
        onClick={handleStartClick}
      >
        시작하기
      </Button>
    </section>
  );
}
