import { describe, expect, it } from 'vitest'

import { getKstDayEnd } from './session'

describe('getKstDayEnd', () => {
  it('returns the next KST midnight as an UTC instant', () => {
    expect(getKstDayEnd(new Date('2026-05-16T03:00:00.000Z')).toISOString()).toBe(
      '2026-05-16T15:00:00.000Z',
    )
  })

  it('uses the following KST day when the UTC time is already next day in Korea', () => {
    expect(getKstDayEnd(new Date('2026-05-16T16:00:00.000Z')).toISOString()).toBe(
      '2026-05-17T15:00:00.000Z',
    )
  })
})
