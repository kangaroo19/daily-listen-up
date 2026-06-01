import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { clientEnv } from "../config/clientEnv";

export type TossAdPurpose = "answer-result" | "retry" | "script";

export async function showTossAd(purpose: TossAdPurpose): Promise<void> {
  if (purpose !== "answer-result") {
    throw new Error("Unsupported ad purpose.");
  }

  if (clientEnv.skipAnswerResultInterstitial) {
    return;
  }

  const adGroupId =
    clientEnv.tossInterstitialAdGroupId || "ait-ad-test-interstitial-id";

  await loadInterstitialAd(adGroupId);
  await showInterstitialAd(adGroupId);
}

function loadInterstitialAd(adGroupId: string): Promise<void> {
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

function showInterstitialAd(adGroupId: string): Promise<void> {
  if (!showFullScreenAd.isSupported()) {
    return Promise.reject(new Error("Toss Ads show is not supported."));
  }

  return new Promise((resolve, reject) => {
    const unregister = showFullScreenAd({
      options: {
        adGroupId,
      },
      onEvent: (event) => {
        if (event.type === "dismissed") {
          unregister();
          resolve();
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
