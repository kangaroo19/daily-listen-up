import { createHash, randomBytes } from 'node:crypto'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(sessionToken: string) {
  return createHash('sha256').update(sessionToken).digest('hex')
}

export function getKstDayEnd(now: Date) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  const nextKstMidnightUtcMs =
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate() + 1,
    ) - KST_OFFSET_MS

  return new Date(nextKstMidnightUtcMs)
}

export function getKstQuizDate(now: Date) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  const year = kstNow.getUTCFullYear()
  const month = String(kstNow.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstNow.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
