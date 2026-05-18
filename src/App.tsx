import { appLogin } from "@apps-in-toss/web-framework";
import { Button, Top } from "@toss/tds-mobile";
import { useState } from "react";

import { performTossLogin } from "./auth/loginFlow";
import { loadTodayQuiz } from "./quiz/todayQuizClient";
import "./App.css";

type HomeStatus =
  | "idle"
  | "loginLoading"
  | "quizLoading"
  | "quizAvailable"
  | "quizEmpty"
  | "loginError"
  | "quizError";

function App() {
  const [homeStatus, setHomeStatus] = useState<HomeStatus>("idle");

  const isBusy = homeStatus === "loginLoading" || homeStatus === "quizLoading";
  const statusMessage = getStatusMessage(homeStatus);

  async function handleStart() {
    if (isBusy) {
      return;
    }

    setHomeStatus("loginLoading");

    try {
      await performTossLogin({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        appLogin,
        fetch: window.fetch.bind(window),
        storage: window.sessionStorage,
      });
      setHomeStatus("quizLoading");
    } catch {
      setHomeStatus("loginError");
      return;
    }

    try {
      const todayQuiz = await loadTodayQuiz({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        fetch: window.fetch.bind(window),
        storage: window.sessionStorage,
      });

      setHomeStatus(
        todayQuiz.status === "available" ? "quizAvailable" : "quizEmpty",
      );
    } catch {
      setHomeStatus("quizError");
    }
  }

  return (
    <main className="home-screen">
      <Top
        title={
          <Top.TitleParagraph size={22}>
            오늘의 영어 듣고 포인트 받기
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할
            수 있어요.
          </Top.SubtitleParagraph>
        }
      />

      <div className="home-content">
        <p className="home-status" role="status">
          {statusMessage}
        </p>
      </div>

      <div className="home-cta">
        <Button
          display="full"
          disabled={isBusy || homeStatus === "quizAvailable"}
          loading={isBusy}
          onClick={handleStart}
        >
          시작하기
        </Button>
      </div>
    </main>
  );
}

function getStatusMessage(homeStatus: HomeStatus) {
  switch (homeStatus) {
    case "loginLoading":
      return "로그인을 진행하고 있어요.";
    case "quizLoading":
      return "로그인 완료, 오늘 문제를 준비 중이에요.";
    case "quizAvailable":
      return "오늘 문제를 불러왔어요.";
    case "quizEmpty":
      return "오늘의 문제가 아직 준비되지 않았어요.";
    case "quizError":
      return "문제를 불러오지 못했어요.";
    case "loginError":
      return "로그인을 완료하지 못했어요. 다시 시작해 주세요.";
    default:
      return "하루에 한 문제만 제공돼요.";
  }
}

export default App;
