import { Link } from '@tanstack/react-router'
import type { CupQuarter } from '@/features/salami-cup/api'

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(iso: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const day = new Date(iso)
  day.setHours(0, 0, 0, 0)
  return Math.round((day.getTime() - start.getTime()) / DAY_MS)
}

/** Live, or open/drawn with the cup day still ahead. A past date that was never moved on is stale data, not a countdown. */
export function shouldShowCupBanner(cup: CupQuarter | null | undefined): cup is CupQuarter {
  if (!cup) return false
  if (cup.status === 'live') return true
  return (cup.status === 'open' || cup.status === 'drawn') && daysUntil(cup.scheduled_at) >= 0
}

function countdownTitle(days: number) {
  if (days === 0) return 'The Salami Cup is today'
  if (days === 1) return 'The Salami Cup is tomorrow'
  return `The Salami Cup is in ${days} days`
}

function eyebrow(cup: CupQuarter) {
  if (cup.status === 'live') return `${cup.label} · live now`
  if (cup.status === 'drawn') return `${cup.label} · squads are up`
  if (new Date(cup.entries_close_at) > new Date()) {
    const close = new Date(cup.entries_close_at).toLocaleDateString('en-GB', { weekday: 'short' })
    return `${cup.label} · entries close ${close}`
  }
  return `${cup.label} · entries closed`
}

/** Shown on Home only while a cup is open, drawn or live. */
export function CupBanner({ cup }: { cup: CupQuarter }) {
  const live = cup.status === 'live'
  const when = new Date(cup.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-[1.5px] border-astro-amber/50 px-[26px] py-6"
      style={{
        background: 'linear-gradient(100deg,#2f1a09 0%,#241a3f 46%,#111a33 100%)',
        clipPath: 'polygon(0 0,100% 0,100% calc(100% - 26px),calc(100% - 26px) 100%,0 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -inset-[40%]"
        style={{
          background: 'linear-gradient(115deg,transparent 44%,rgba(255,255,255,0.08) 50%,transparent 56%)',
          animation: 'astro-sweep 6.5s ease-in-out infinite',
        }}
      />
      <div
        className="font-display pointer-events-none absolute -top-[30px] right-[-6px] text-[160px] leading-none text-astro-amber/[0.07]"
        style={{ animation: 'astro-drift 13s ease-in-out infinite' }}
        aria-hidden="true"
      >
        13
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-2.5 flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#f2a93b" aria-hidden="true">
              <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
            </svg>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-amber">{eyebrow(cup)}</div>
          </div>
          <div className="font-display mb-1.5 text-[32px] leading-none text-astro-text md:text-[38px]">
            {live ? 'The Salami Cup is on' : countdownTitle(daysUntil(cup.scheduled_at))}
          </div>
          <p className="max-w-[58ch] text-sm text-astro-text-muted [text-wrap:pretty]">
            {when}
            {cup.venue ? ` at ${cup.venue}` : ''}. Not the weekly ballot. Played for Ade, four times a year.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2.5">
          <Link
            to="/salami-cup"
            className="rounded-[11px] bg-astro-amber px-[22px] py-[13px] text-center text-sm font-extrabold text-astro-on-amber no-underline transition-transform hover:-translate-y-0.5 active:translate-y-px"
          >
            Open the cup
          </Link>
          {cup.status !== 'open' && (
            <Link
              to="/salami-cup"
              className="text-center text-[12.5px] font-bold text-astro-text-muted no-underline hover:text-astro-text"
            >
              Squads &amp; fixtures &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
