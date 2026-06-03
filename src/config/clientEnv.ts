export const clientEnv = {
  apiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL,
  tossAppName: import.meta.env.VITE_TOSS_APP_NAME,
  tossInterstitialAdGroupId: import.meta.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID,
  tossRewardedAdGroupId: import.meta.env.VITE_TOSS_REWARDED_AD_GROUP_ID,
  skipAnswerResultInterstitial: import.meta.env.VITE_SKIP_ANSWER_RESULT_INTERSTITIAL === 'true',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
} as const;
