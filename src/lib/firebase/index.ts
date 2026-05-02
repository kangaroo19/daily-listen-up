import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { FirebaseRuntimeConfig } from '../../shared/config';

export type FirebaseClient = {
  app: FirebaseApp;
  firestore: Firestore;
  projectId: string;
};

export function initializeFirebase(
  config: FirebaseRuntimeConfig,
): FirebaseClient {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);

  return {
    app,
    firestore: getFirestore(app),
    projectId: config.projectId,
  };
}
