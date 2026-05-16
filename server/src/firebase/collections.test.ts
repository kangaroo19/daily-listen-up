import { describe, expect, it } from 'vitest'

import { FIRESTORE_COLLECTIONS } from './collections'

describe('FIRESTORE_COLLECTIONS', () => {
  it('contains the backend collection names', () => {
    expect(FIRESTORE_COLLECTIONS).toEqual({
      quizzes: 'quizzes',
      users: 'users',
      appSessions: 'appSessions',
      userProgress: 'userProgress',
      rewardGrants: 'rewardGrants',
      adRewardEvents: 'adRewardEvents',
    })
  })
})
