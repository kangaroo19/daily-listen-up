import { appLogin } from "@apps-in-toss/web-framework";
import { Button, Top } from "@toss/tds-mobile";
import { useState } from "react";

import { performTossLogin } from "./auth/loginFlow";
import "./App.css";

type LoginStatus = "idle" | "loading" | "success" | "error";

function App() {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");

  const isLoggingIn = loginStatus === "loading";
  const statusMessage =
    loginStatus === "loading"
      ? "로그인을 진행하고 있어요."
      : loginStatus === "success"
        ? "로그인 완료, 오늘 문제를 준비 중이에요."
        : loginStatus === "error"
          ? "로그인을 완료하지 못했어요. 다시 시작해 주세요."
          : "하루에 한 문제만 제공돼요.";

  async function handleStart() {
    if (isLoggingIn) {
      return;
    }

    setLoginStatus("loading");

    try {
      await performTossLogin({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        appLogin,
        fetch: window.fetch.bind(window),
        storage: window.sessionStorage,
      });
      setLoginStatus("success");
    } catch {
      setLoginStatus("error");
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
          disabled={isLoggingIn || loginStatus === "success"}
          loading={isLoggingIn}
          onClick={handleStart}
        >
          시작하기
        </Button>
      </div>
    </main>
  );
}

export default App;
