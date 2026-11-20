import { cn } from 'cn'
import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'rise' | 'hold' | 'fall'

const RISE_MS = 800
const FALL_MS = 900
const HOLD_BASE_MS = 600
const HOLD_PER_HEART_MS = 350
const HOLD_MAX_MS = 6000

const PHASE_ANIMATION: Record<Phase, string | undefined> = {
  idle: undefined,
  rise: `astro-heart-rise ${RISE_MS}ms ease-in forwards`,
  hold: 'astro-heart-hold 1.6s ease-in-out infinite',
  fall: `astro-heart-fall ${FALL_MS}ms ease-out forwards`,
}

const HEART = 'M12 21.4C12 21.4 3.6 16.2 3.6 10.5A4.7 4.7 0 0 1 12 7.2a4.7 4.7 0 0 1 8.4 3.3c0 5.7-8.4 10.9-8.4 10.9Z'

const storageKey = (playerId: string) => `astro-hearts-seen:${playerId}`

function readSeen(playerId: string) {
  try {
    const v = localStorage.getItem(storageKey(playerId))
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}

function writeSeen(playerId: string, n: number) {
  try {
    localStorage.setItem(storageKey(playerId), String(n))
  } catch {
    // Private mode: the surge just won't replay across visits.
  }
}

/**
 * The home heart pill. New hearts (live, or since your last visit) make it swell and run blue to red
 * and back; more hearts landing mid-surge keep it held at red for longer.
 */
export function HeartCount({ count, playerId }: { count: number | undefined; playerId: string | undefined }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [shown, setShown] = useState<number | null>(null)
  const prev = useRef<number | null>(null)
  const holdUntil = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const tick = useRef<number>(undefined)
  const phaseRef = useRef<Phase>('idle')

  const go = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const countUp = (from: number, to: number) => {
    if (tick.current) cancelAnimationFrame(tick.current)
    const start = performance.now()
    const ms = Math.min(RISE_MS, 140 * (to - from))
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      setShown(Math.round(from + (to - from) * k))
      if (k < 1) tick.current = requestAnimationFrame(step)
    }
    tick.current = requestAnimationFrame(step)
  }

  const scheduleFall = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => {
        go('fall')
        timer.current = setTimeout(() => go('idle'), FALL_MS)
      },
      Math.max(0, holdUntil.current - Date.now()),
    )
  }

  const surge = (from: number, to: number) => {
    const extra = Math.min(HOLD_MAX_MS, HOLD_BASE_MS + HOLD_PER_HEART_MS * (to - from))
    const p = phaseRef.current
    holdUntil.current = Math.max(holdUntil.current, Date.now() + (p === 'idle' ? RISE_MS : 0) + extra)
    countUp(from, to)
    if (p === 'idle') {
      go('rise')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        go('hold')
        scheduleFall()
      }, RISE_MS)
    } else if (p === 'fall') {
      go('hold')
      scheduleFall()
    } else if (p === 'hold') {
      scheduleFall()
    }
  }

  useEffect(() => {
    if (count == null || !playerId) return
    const before = prev.current ?? readSeen(playerId)
    prev.current = count
    writeSeen(playerId, count)
    if (before != null && count > before) surge(before, count)
    else setShown(count)
    // surge reads only refs, so it's safe to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, playerId])

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (tick.current) cancelAnimationFrame(tick.current)
    },
    [],
  )

  const active = phase !== 'idle'

  return (
    <span aria-live="polite" className="astro-heart-pill inline-flex shrink-0 text-[#38bdf8]" style={{ animation: PHASE_ANIMATION[phase] }}>
      <span
        className={cn(
          'flex items-center gap-2 rounded-full border bg-astro-surface-2 px-3 py-1.5 md:gap-2.5 md:px-3.5 md:py-2',
          active ? 'border-[color-mix(in_srgb,currentColor_60%,transparent)]' : 'border-border',
        )}
        style={{ animation: active ? 'astro-heart-pump 0.8s ease-in-out infinite' : undefined }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          style={{ animation: active ? 'astro-heart-thump 0.8s ease-in-out infinite' : 'astro-beat 2.6s ease-in-out infinite' }}
        >
          <path d={HEART} />
        </svg>
        <span className="text-[13px] font-bold tabular-nums text-astro-text">{shown ?? count ?? 0}</span>
        <span className="text-xs text-astro-text-dim">likes</span>
      </span>
    </span>
  )
}
