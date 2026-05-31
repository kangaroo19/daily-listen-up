export function getKstDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getKstEndOfDay(date = new Date()): Date {
  const [year, month, day] = getKstDateString(date).split('-').map(Number);
  const nextKstMidnightAsUtc = Date.UTC(year, month - 1, day + 1, -9, 0, 0, 0);

  return new Date(nextKstMidnightAsUtc);
}
