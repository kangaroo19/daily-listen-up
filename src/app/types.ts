import type { AppRuntimeConfig } from '../shared/config';
import type { FirebaseClient } from '../lib/firebase';
import type { TossRuntime } from '../lib/toss';
import type { TossAdsClient } from '../lib/toss-ads';
import type { ApiClient } from '../services/api';

export type AppRuntime = {
  config: AppRuntimeConfig;
  firebase: FirebaseClient;
  toss: TossRuntime;
  ads: TossAdsClient;
  api: ApiClient;
};

export type AppBootState =
  | { status: 'bootstrapping' }
  | { status: 'ready'; runtime: AppRuntime }
  | { status: 'initFailed'; error: Error };
