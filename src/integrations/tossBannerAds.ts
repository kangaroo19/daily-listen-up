import {
  TossAds,
  type TossAdsAttachBannerOptions,
  type TossAdsAttachBannerResult,
} from "@apps-in-toss/web-framework";
import { clientEnv } from "../config/clientEnv";

type InitializationState = "idle" | "pending" | "initialized" | "unavailable";

let initializationState: InitializationState = "idle";
let initializationPromise: Promise<boolean> | null = null;

export function getTossBannerAdGroupId(): string {
  return clientEnv.tossBannerAdGroupId;
}

export function initializeTossBannerAds(): Promise<boolean> {
  if (clientEnv.skipAnswerResultInterstitial) {
    return Promise.resolve(false);
  }

  if (initializationState === "initialized") {
    return Promise.resolve(true);
  }

  if (initializationState === "unavailable") {
    return Promise.resolve(false);
  }

  if (initializationState === "pending" && initializationPromise != null) {
    return initializationPromise;
  }

  if (!TossAds.initialize.isSupported()) {
    initializationState = "unavailable";
    return Promise.resolve(false);
  }

  initializationState = "pending";
  initializationPromise = new Promise((resolve) => {
    try {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            initializationState = "initialized";
            resolve(true);
          },
          onInitializationFailed: () => {
            initializationState = "unavailable";
            resolve(false);
          },
        },
      });
    } catch {
      initializationState = "unavailable";
      resolve(false);
    }
  });

  return initializationPromise;
}

export async function attachTossBannerAd(
  target: HTMLElement,
): Promise<TossAdsAttachBannerResult | null> {
  if (clientEnv.skipAnswerResultInterstitial) {
    return null;
  }

  if (!TossAds.attachBanner.isSupported()) {
    return null;
  }

  const isInitialized = await initializeTossBannerAds();

  if (!isInitialized) {
    return null;
  }

  try {
    return TossAds.attachBanner(
      getTossBannerAdGroupId(),
      target,
      getTossBannerOptions(),
    );
  } catch {
    return null;
  }
}

function getTossBannerOptions(): TossAdsAttachBannerOptions {
  return {
    variant: "expanded",
    theme: "auto",
    tone: "blackAndWhite",
    callbacks: {
      onNoFill: () => {},
      onAdFailedToRender: () => {},
    },
  };
}
