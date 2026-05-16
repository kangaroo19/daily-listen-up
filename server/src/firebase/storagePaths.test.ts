import { describe, expect, it } from 'vitest'

import { getQuizAudioStoragePath } from './storagePaths'

describe('getQuizAudioStoragePath', () => {
  it('builds the quiz audio path from quiz date and quiz id', () => {
    expect(getQuizAudioStoragePath('2026-05-16', 'daily-basic-001')).toBe(
      'quiz-audio/2026-05-16/daily-basic-001.mp3',
    )
  })

  it('rejects missing quiz date', () => {
    expect(() => getQuizAudioStoragePath('', 'daily-basic-001')).toThrow(
      'quizDate is required',
    )
  })

  it('rejects missing quiz id', () => {
    expect(() => getQuizAudioStoragePath('2026-05-16', '')).toThrow(
      'quizId is required',
    )
  })
})
