import { initializeFirebase } from '../lib/firebase';
import { createApiClient } from '../services/api';
import { loadAppConfig } from '../shared/config';
import { detectTossRuntime } from '../lib/toss';
import { createTossAdsClient } from '../lib/toss-ads';
import type { AppRuntime } from './types';

let runtimePromise: Promise<AppRuntime> | undefined;

export function initializeAppRuntime() {
  runtimePromise ??= boot();
  return runtimePromise;
}

async function boot(): Promise<AppRuntime> {
  const config = loadAppConfig();
  const firebase = initializeFirebase(config.firebase);
  const toss = await detectTossRuntime();
  const ads = createTossAdsClient(toss);
  const api = createApiClient({ baseUrl: config.apiBaseUrl });

  return {
    config,
    firebase,
    toss,
    ads,
    api,
  };
}
