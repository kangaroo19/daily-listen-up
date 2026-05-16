import { describe, expect, it } from 'vitest'

import { getFirebaseAdminConfig } from './admin'

describe('getFirebaseAdminConfig', () => {
  it('uses application default credentials when only project id is provided', () => {
    expect(
      getFirebaseAdminConfig({
        FIREBASE_PROJECT_ID: 'daily-listen-up-dev',
      }),
    ).toEqual({
      projectId: 'daily-listen-up-dev',
      credentialSource: 'application-default',
    })
  })

  it('uses service account env values when client email and private key are provided', () => {
    expect(
      getFirebaseAdminConfig({
        FIREBASE_PROJECT_ID: 'daily-listen-up-dev',
        FIREBASE_CLIENT_EMAIL: 'firebase-admin@example.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n',
      }),
    ).toEqual({
      projectId: 'daily-listen-up-dev',
      clientEmail: 'firebase-admin@example.iam.gserviceaccount.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----\n',
      credentialSource: 'service-account-env',
    })
  })

  it('rejects missing project id', () => {
    expect(() => getFirebaseAdminConfig({})).toThrow(
      'FIREBASE_PROJECT_ID is required',
    )
  })

  it('rejects incomplete service account env values', () => {
    expect(() =>
      getFirebaseAdminConfig({
        FIREBASE_PROJECT_ID: 'daily-listen-up-dev',
        FIREBASE_CLIENT_EMAIL: 'firebase-admin@example.iam.gserviceaccount.com',
      }),
    ).toThrow('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be provided together')
  })
})
