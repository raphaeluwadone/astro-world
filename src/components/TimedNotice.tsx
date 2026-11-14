import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const KEY = 'astro:dismissed-notices'
const DURATION = 8000

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function isNoticeDismissed(id: string) {
  return readDismissed().includes(id)
}

/** Marks notices as seen, so they don't show again on this device. */
export function rememberNotices(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...readDismissed().filter((d) => !ids.includes(d)), ...ids].slice(-80)))
  } catch {
    // Private mode: it just shows again next visit.
  }
}

const remember = (id: string) => rememberNotices([id])

/**
 * A banner that isn't about you: closes with an X, or by itself after 8 seconds on screen.
 * Hovering or focusing it pauses the timer. Once it has been on screen it won't come back on this device.
 */
export function TimedNotice({
  id,
  autoHide = true,
  className,
  children,
}: {
  id: string
  autoHide?: boolean
  className?: string
  children: ReactNode
}) {
  const [hidden, setHidden] = useState(() => isNoticeDismissed(id))
  const [leaving, setLeaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const remaining = useRef(DURATION)
  const running = autoHide && visible && !paused && !leaving

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [hidden])

  // Shown once is enough: leaving before the timer runs out still counts.
  useEffect(() => {
    if (autoHide && !hidden) remember(id)
  }, [autoHide, hidden, id])

  useEffect(() => {
    if (!running) return
    const start = Date.now()
    const t = setTimeout(() => close(id), remaining.current)
    return () => {
      clearTimeout(t)
      remaining.current -= Date.now() - start
    }
  }, [running, id])

  function close(noticeId: string) {
    remember(noticeId)
    setLeaving(true)
    setTimeout(() => setHidden(true), 240)
  }

  if (hidden) return null

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden transition-[opacity,transform] duration-200', leaving && 'pointer-events-none -translate-y-1 opacity-0', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {children}
      <button
        type="button"
        aria-label="Close"
        onClick={() => close(id)}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/25 text-astro-text-muted backdrop-blur-sm hover:bg-black/40 hover:text-astro-text"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
          <path d="m6.4 4.8 5.6 5.6 5.6-5.6 1.6 1.6-5.6 5.6 5.6 5.6-1.6 1.6-5.6-5.6-5.6 5.6-1.6-1.6 5.6-5.6-5.6-5.6Z" />
        </svg>
      </button>
      {autoHide && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left bg-white/30"
          style={{ animation: `notice-drain ${DURATION}ms linear forwards`, animationPlayState: running ? 'running' : 'paused' }}
        />
      )}
    </div>
  )
}
