import { getApp, getApps, initializeApp, type App } from 'firebase-admin/app'
import { applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

type FirebaseAdminEnv = NodeJS.ProcessEnv | Record<string, string | undefined>

export type FirebaseAdminConfig =
  | {
      projectId: string
      credentialSource: 'application-default'
    }
  | {
      projectId: string
      clientEmail: string
      privateKey: string
      credentialSource: 'service-account-env'
    }

export function getFirebaseAdminConfig(env: FirebaseAdminEnv): FirebaseAdminConfig {
  const projectId = env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId == null || projectId.length === 0) {
    throw new Error('FIREBASE_PROJECT_ID is required')
  }

  if (
    (clientEmail != null && clientEmail.length > 0) ||
    (privateKey != null && privateKey.length > 0)
  ) {
    if (clientEmail == null || clientEmail.length === 0 || privateKey == null || privateKey.length === 0) {
      throw new Error(
        'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be provided together',
      )
    }

    return {
      projectId,
      clientEmail,
      privateKey,
      credentialSource: 'service-account-env',
    }
  }

  return {
    projectId,
    credentialSource: 'application-default',
  }
}

export function initializeFirebaseAdmin(env: FirebaseAdminEnv = process.env): App {
  if (getApps().length > 0) {
    return getApp()
  }

  const config = getFirebaseAdminConfig(env)

  if (config.credentialSource === 'service-account-env') {
    return initializeApp({
      projectId: config.projectId,
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    })
  }

  return initializeApp({
    projectId: config.projectId,
    credential: applicationDefault(),
  })
}

export function getFirebaseFirestore() {
  return getFirestore(initializeFirebaseAdmin())
}

export function getFirebaseStorage() {
  return getStorage(initializeFirebaseAdmin())
}
