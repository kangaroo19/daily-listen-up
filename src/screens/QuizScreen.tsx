import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, useToast } from '@toss/tds-mobile';
import { showTossAd } from '../integrations/tossAds';
import { getTodayQuiz, postAnswerResult, type AnswerResultResponse, type TodayQuizResponse } from '../services/apiClient';
import { getAppSessionToken } from '../services/appSession';

type QuizScreenProps = {
  onAnswerResult: (result: AnswerResultResponse, quizDate: string) => void;
};

export function QuizScreen({ onAnswerResult }: QuizScreenProps) {
  const { openToast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [quiz, setQuiz] = useState<TodayQuizResponse | null>(null);
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFailed, setIsFailed] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasFinishedAudio, setHasFinishedAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuiz() {
      const appSessionToken = getAppSessionToken();

      if (appSessionToken == null) {
        setIsFailed(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsFailed(false);
      setQuiz(null);
      setSelectedChoiceIds([]);
      setHasStartedAudio(false);
      setIsAudioPlaying(false);
      setHasFinishedAudio(false);
      setIsSubmitting(false);

      try {
        const todayQuiz = await getTodayQuiz(appSessionToken, controller.signal);
        setQuiz(todayQuiz);
      } catch (error) {
        if (!controller.signal.aborted) {
          setIsFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadQuiz();

    return () => {
      controller.abort();
    };
  }, [loadAttempt]);

  const submissionBoundary = useMemo(
    () =>
      quiz == null
        ? null
        : {
            quizDate: quiz.quizDate,
            selectedChoiceIds,
          },
    [quiz, selectedChoiceIds],
  );

  const canSubmit = hasFinishedAudio && submissionBoundary != null && selectedChoiceIds.length > 0 && !isSubmitting;

  async function handleStartAudio() {
    const audio = audioRef.current;

    if (audio == null || hasStartedAudio) {
      return;
    }

    setHasStartedAudio(true);
    setIsAudioPlaying(true);

    try {
      await audio.play();
    } catch {
      setIsAudioPlaying(false);
      setIsFailed(true);
    }
  }

  function handleRetry() {
    setLoadAttempt((current) => current + 1);
  }

  function handleToggleChoice(choiceId: string) {
    setSelectedChoiceIds((current) =>
      current.includes(choiceId) ? current.filter((selectedId) => selectedId !== choiceId) : [...current, choiceId],
    );
  }

  async function handleSubmitAnswer() {
    const appSessionToken = getAppSessionToken();

    if (!canSubmit || submissionBoundary == null || appSessionToken == null) {
      return;
    }

    setIsSubmitting(true);

    try {
      await showTossAd('answer-result');
      const answerResult = await postAnswerResult(appSessionToken, submissionBoundary);
      onAnswerResult(answerResult, submissionBoundary.quizDate);
    } catch {
      openToast('답안 제출을 완료하지 못했어요. 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="screen quiz-screen">
        <p className="eyebrow">오늘의 문제</p>
        <h1>오늘의 영어를 들어보세요</h1>
        <p className="description">문제를 불러오고 있어요.</p>
      </section>
    );
  }

  if (isFailed || quiz == null) {
    return (
      <section className="screen quiz-screen">
        <p className="eyebrow">오늘의 문제</p>
        <h1>문제를 불러오지 못했어요.</h1>
        <div className="quiz-bottom-action">
          <Button display="block" onClick={handleRetry}>
            다시 시도
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen quiz-screen">
      <p className="eyebrow">오늘의 문제</p>
      <h1>{hasFinishedAudio ? '정답이라고 생각하는 답을 모두 골라주세요' : '오늘의 영어를 들어보세요'}</h1>
      {!hasFinishedAudio && <p className="description">음성을 끝까지 들은 뒤 문제를 풀 수 있어요.</p>}

      <audio
        ref={audioRef}
        src={quiz.audioUrl}
        preload="metadata"
        onEnded={() => {
          setIsAudioPlaying(false);
          setHasFinishedAudio(true);
        }}
        onError={() => {
          setIsAudioPlaying(false);
          setIsFailed(true);
        }}
      />

      {!hasFinishedAudio ? (
        <div className="audio-panel">
          <Button display="block" disabled={hasStartedAudio} onClick={handleStartAudio}>
            듣기 시작
          </Button>
          <p className="supporting">
            {isAudioPlaying ? '음성을 재생하고 있어요.' : hasStartedAudio ? '재생이 끝나면 선택지가 열려요.' : '재생은 한 번만 가능해요.'}
          </p>
        </div>
      ) : (
        <div className="choice-list" role="group" aria-label="정답 선택지">
          {quiz.choices.map((choice) => {
            const isSelected = selectedChoiceIds.includes(choice.id);

            return (
              <button
                key={choice.id}
                type="button"
                className={isSelected ? 'choice-button choice-button-selected' : 'choice-button'}
                aria-pressed={isSelected}
                onClick={() => handleToggleChoice(choice.id)}
              >
                {choice.text}
              </button>
            );
          })}
        </div>
      )}

      <div className="quiz-bottom-action">
        <Button display="block" disabled={!canSubmit} loading={isSubmitting} onClick={handleSubmitAnswer}>
          <span className="submit-button-content">
            <span className="video-icon" aria-hidden="true" />
            답안 제출
          </span>
        </Button>
      </div>
    </section>
  );
}
