import { APP_TIMEZONE } from '@/lib/timezone'

const HOUR = 60 * 60 * 1000
const LAGOS_OFFSET = HOUR

/** Saturday 20:00 Lagos before the matchday, or 12 hours before kick-off if that's earlier. Mirrors spot_pay_deadline(). */
export function payDeadline(playedAt: string): Date {
  const kickoff = new Date(playedAt).getTime()
  const local = new Date(kickoff + LAGOS_OFFSET)
  const back = (local.getUTCDay() + 1) % 7
  const saturday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - back, 20) - LAGOS_OFFSET
  return new Date(Math.min(saturday, kickoff - 12 * HOUR))
}

export const formatDeadline = (d: Date) =>
  d.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).replace(',', '')
