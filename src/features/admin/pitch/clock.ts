import { useEffect, useState } from 'react'
import { clockMs, type PitchGame } from './api'

export function fmtClock(ms: number) {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [active])
  return now
}

/** Countdown from the game length; past zero it counts the added time. */
export function countdown(game: Pick<PitchGame, 'elapsed_ms' | 'running_since' | 'length_min'>, now: number) {
  const elapsed = clockMs(game, now)
  const total = game.length_min * 60_000
  const over = elapsed >= total
  return { over, label: over ? `+${fmtClock(elapsed - total)}` : fmtClock(total - elapsed), progress: Math.min(1, elapsed / total) }
}

/** 4′, or 6+1′ for a goal in added time. */
export function fmtMinute(minute: number | null, lengthMin: number) {
  if (minute == null) return null
  return minute > lengthMin ? `${lengthMin}+${minute - lengthMin}′` : `${minute}′`
}
