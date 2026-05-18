import { appLogin } from "@apps-in-toss/web-framework";
import { Button, Top } from "@toss/tds-mobile";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { resolveEntryRoute, type HomeEntryState } from "./app/entryFlow";
import { performTossLogin } from "./auth/loginFlow";
import type { TodayQuizResult } from "./quiz/todayQuizClient";
import "./App.css";

type HomeStatus = "loginError" | HomeEntryState;

function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryRouter initialPage="home" />} />
      <Route path="/quiz" element={<EntryRouter initialPage="quiz" />} />
      <Route path="/result" element={<EntryRouter initialPage="result" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EntryRouter({
  initialPage,
}: {
  initialPage: "home" | "quiz" | "result";
}) {
  const navigate = useNavigate();
  const [homeStatus, setHomeStatus] = useState<HomeStatus>("idle");
  const [todayQuiz, setTodayQuiz] = useState<TodayQuizResult | null>(null);
  const [isCheckingEntry, setIsCheckingEntry] = useState(false);

  const runEntryFlow = useCallback(async () => {
    setIsCheckingEntry(true);

    const result = await resolveEntryRoute({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      fetch: window.fetch.bind(window),
      storage: window.sessionStorage,
    });

    setTodayQuiz(result.todayQuiz ?? null);

    if (result.route === "/") {
      setHomeStatus(result.homeState);
    }

    navigate(result.route, { replace: true });
    setIsCheckingEntry(false);

    return result;
  }, [navigate]);

  useEffect(() => {
    void runEntryFlow();
  }, [runEntryFlow]);

  if (isCheckingEntry) {
    return <LoadingShell message="오늘 문제를 확인하고 있어요." />;
  }

  if (initialPage === "quiz") {
    return <QuizShell todayQuiz={todayQuiz} />;
  }

  if (initialPage === "result") {
    return <ResultShell />;
  }

  return <HomePage homeStatus={homeStatus} onLoginComplete={runEntryFlow} />;
}

function HomePage({
  homeStatus,
  onLoginComplete,
}: {
  homeStatus: HomeStatus;
  onLoginComplete: () => Promise<unknown>;
}) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const isEmpty = homeStatus === "empty";
  const isBusy = isLoggingIn;
  const statusMessage = isLoggingIn
    ? "로그인을 진행하고 있어요."
    : hasLoginError
      ? "로그인을 완료하지 못했어요. 다시 시작해 주세요."
      : getStatusMessage(homeStatus);

  async function handleStart() {
    if (isBusy || isEmpty) {
      return;
    }

    setIsLoggingIn(true);
    setHasLoginError(false);

    try {
      await performTossLogin({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        appLogin,
        fetch: window.fetch.bind(window),
        storage: window.sessionStorage,
      });
      await onLoginComplete();
    } catch {
      setHasLoginError(true);
    } finally {
      setIsLoggingIn(false);
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
        {isEmpty ? (
          <p className="home-status-detail">잠시 후 다시 확인해 주세요.</p>
        ) : null}
      </div>

      <div className="home-cta">
        {isEmpty ? (
          <p className="home-ready-state">준비 중</p>
        ) : (
          <Button
            display="full"
            disabled={isBusy}
            loading={isBusy}
            onClick={handleStart}
          >
            시작하기
          </Button>
        )}
      </div>
    </main>
  );
}

function LoadingShell({ message }: { message: string }) {
  return (
    <main className="page-shell">
      <p className="home-status" role="status">
        {message}
      </p>
    </main>
  );
}

function QuizShell({ todayQuiz }: { todayQuiz: TodayQuizResult | null }) {
  return (
    <main className="page-shell">
      <Top
        title={
          <Top.TitleParagraph size={22}>
            오늘의 영어를 들어보세요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            {todayQuiz?.status === "available"
              ? todayQuiz.quiz.questionText
              : "문제를 준비하고 있어요."}
          </Top.SubtitleParagraph>
        }
      />
    </main>
  );
}

function ResultShell() {
  return (
    <main className="page-shell">
      <Top
        title={
          <Top.TitleParagraph size={22}>
            오늘 학습을 완료했어요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            내일 새로운 문제로 다시 만나요.
          </Top.SubtitleParagraph>
        }
      />
    </main>
  );
}

function getStatusMessage(homeStatus: HomeStatus) {
  switch (homeStatus) {
    case "empty":
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
