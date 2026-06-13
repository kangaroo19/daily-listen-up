import { useEffect, useState } from 'react';
import { Button, useToast } from '@toss/tds-mobile';
import { TossBannerAd } from '../components/TossBannerAd';
import { showTossAd } from '../integrations/tossAds';
import {
  getRewardStatus,
  postRewardedAdComplete,
  type AnswerResultResponse,
  type RewardStatus,
  type RewardedAdPurpose,
} from '../services/apiClient';
import { getAppSessionToken } from '../services/appSession';

type AnswerResultState = AnswerResultResponse & {
  quizDate: string;
};

type ResultScreenProps = {
  answerResult: AnswerResultState | null;
  onRetry: () => void;
  onHome: () => void;
};

export function ResultScreen({ answerResult, onRetry, onHome }: ResultScreenProps) {
  const { openToast } = useToast();
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>(answerResult?.rewardStatus ?? 'none');
  const [script, setScript] = useState<string | null>(null);
  const [actionPurpose, setActionPurpose] = useState<RewardedAdPurpose | null>(null);

  useEffect(() => {
    setRewardStatus(answerResult?.rewardStatus ?? 'none');
    setScript(null);
  }, [answerResult]);

  useEffect(() => {
    if (answerResult?.isCorrect !== true || answerResult.rewardStatus !== 'pending') {
      return;
    }

    const appSessionToken = getAppSessionToken();

    if (appSessionToken == null) {
      return;
    }

    const token = appSessionToken;
    let isMounted = true;

    async function refreshRewardStatus() {
      try {
        const nextStatus = await getRewardStatus(token);

        if (isMounted) {
          setRewardStatus(nextStatus.rewardStatus);
        }
      } catch {
        // Keep the answer-result status when refresh fails; the user can retry from Home later.
      }
    }

    void refreshRewardStatus();

    return () => {
      isMounted = false;
    };
  }, [answerResult]);

  if (answerResult == null) {
    return (
      <section className="screen result-screen">
        <p className="eyebrow">결과</p>
        <h1>오늘 학습을 완료했어요</h1>
        <p className="description">내일 새로운 문제로 다시 만나요.</p>
        <div className="result-bottom-action">
          <Button display="block" variant="weak" onClick={onHome}>
            홈으로
          </Button>
        </div>
      </section>
    );
  }

  const title = answerResult.isCorrect ? '정답이에요' : '아쉬워요';
  const description = answerResult.isCorrect ? '포인트 보상 상태를 확인해 주세요.' : '광고를 보고 같은 문제에 다시 도전할 수 있어요.';
  const isRetryLoading = actionPurpose === 'retry';
  const isScriptLoading = actionPurpose === 'script';

  async function handleRewardedAction(purpose: RewardedAdPurpose) {
    const appSessionToken = getAppSessionToken();

    if (answerResult == null || appSessionToken == null || actionPurpose != null) {
      return;
    }

    setActionPurpose(purpose);

    try {
      await showTossAd(purpose);
      const result = await postRewardedAdComplete(appSessionToken, {
        quizDate: answerResult.quizDate,
        purpose,
        userEarnedReward: true,
      });

      if (purpose === 'retry') {
        setActionPurpose(null);
        onRetry();
        return;
      }

      setScript(result.script ?? null);
    } catch {
      openToast('광고를 완료하지 못했어요. 다시 시도해 주세요.');
    } finally {
      if (purpose === 'script') {
        setActionPurpose(null);
      }
    }
  }

  return (
    <section className="screen result-screen">
      <p className="eyebrow">결과</p>
      <h1>{title}</h1>
      <p className="description">{description}</p>

      {answerResult.isCorrect && (
        <div className="result-panel">
          <strong>오늘 학습을 완료했어요</strong>
          <p>내일 새로운 문제로 다시 만나요.</p>
          <p>{getRewardStatusMessage(rewardStatus)}</p>
        </div>
      )}

      {script != null && (
        <div className="script-panel">
          <strong>듣기 스크립트</strong>
          <p>{script}</p>
        </div>
      )}

      <TossBannerAd />

      <div className="result-bottom-action">
        {!answerResult.isCorrect && (
          <Button
            display="block"
            loading={isRetryLoading}
            disabled={actionPurpose != null}
            onClick={() => void handleRewardedAction('retry')}
          >
            광고 보고 재도전
          </Button>
        )}
        <Button
          display="block"
          variant={answerResult.isCorrect ? undefined : 'weak'}
          loading={isScriptLoading}
          disabled={actionPurpose != null}
          onClick={() => void handleRewardedAction('script')}
        >
          광고 보고 스크립트 보기
        </Button>
        <Button display="block" variant="weak" disabled={actionPurpose != null} onClick={onHome}>
          홈으로
        </Button>
      </div>
    </section>
  );
}

function getRewardStatusMessage(status: RewardStatus): string {
  if (status === 'pending') {
    return '포인트 지급을 확인하고 있어요.';
  }

  if (status === 'success') {
    return '포인트 지급이 완료됐어요.';
  }

  if (status === 'failed') {
    return '포인트 지급을 완료하지 못했어요. 잠시 후 다시 확인하거나 고객센터에 문의해 주세요.';
  }

  return '포인트 지급 상태를 확인하고 있어요.';
}
