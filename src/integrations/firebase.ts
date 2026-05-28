import type { FirebaseOptions } from 'firebase/app';
import { clientEnv } from '../config/clientEnv';

export function getFirebaseClientOptions(): FirebaseOptions {
  return {
    apiKey: clientEnv.firebase.apiKey,
    authDomain: clientEnv.firebase.authDomain,
    projectId: clientEnv.firebase.projectId,
    storageBucket: clientEnv.firebase.storageBucket,
    messagingSenderId: clientEnv.firebase.messagingSenderId,
    appId: clientEnv.firebase.appId,
  };
}
