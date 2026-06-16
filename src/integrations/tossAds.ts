import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { clientEnv } from "../config/clientEnv";

export type TossAdPurpose = "answer-result" | "retry" | "script";

export async function showTossAd(purpose: TossAdPurpose): Promise<void> {
  if (clientEnv.skipAnswerResultInterstitial) {
    return;
  }

  const adGroupId = getAdGroupId(purpose);

  await loadFullScreenTossAd(adGroupId);
  await showFullScreenTossAd(adGroupId, purpose);
}

function getAdGroupId(purpose: TossAdPurpose): string {
  if (purpose === "answer-result") {
    return clientEnv.tossInterstitialAdGroupId || "ait-ad-test-interstitial-id";
  }

  if (purpose === "retry") {
    return clientEnv.tossRetryRewardedAdGroupId || "ait-ad-test-rewarded-id";
  }

  return clientEnv.tossScriptRewardedAdGroupId || "ait-ad-test-rewarded-id";
}

function loadFullScreenTossAd(adGroupId: string): Promise<void> {
  if (!loadFullScreenAd.isSupported()) {
    return Promise.reject(new Error("Toss Ads load is not supported."));
  }

  return new Promise((resolve, reject) => {
    const unregister = loadFullScreenAd({
      options: {
        adGroupId,
      },
      onEvent: (event) => {
        if (event.type === "loaded") {
          unregister();
          resolve();
        }
      },
      onError: (error) => {
        unregister();
        reject(
          error instanceof Error ? error : new Error("Toss Ads load failed."),
        );
      },
    });
  });
}

function showFullScreenTossAd(adGroupId: string, purpose: TossAdPurpose): Promise<void> {
  if (!showFullScreenAd.isSupported()) {
    return Promise.reject(new Error("Toss Ads show is not supported."));
  }

  return new Promise((resolve, reject) => {
    let hasEarnedReward = false;
    const unregister = showFullScreenAd({
      options: {
        adGroupId,
      },
      onEvent: (event) => {
        if (purpose === "answer-result" && event.type === "dismissed") {
          unregister();
          resolve();
        }

        if (purpose !== "answer-result" && event.type === "userEarnedReward") {
          hasEarnedReward = true;
          unregister();
          resolve();
        }

        if (purpose !== "answer-result" && event.type === "dismissed" && !hasEarnedReward) {
          unregister();
          reject(new Error("Toss rewarded ad was dismissed before reward."));
        }

        if (event.type === "failedToShow") {
          unregister();
          reject(new Error("Toss Ads show failed."));
        }
      },
      onError: (error) => {
        unregister();
        reject(
          error instanceof Error ? error : new Error("Toss Ads show failed."),
        );
      },
    });
  });
}
