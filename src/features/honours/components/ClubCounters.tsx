import { cn } from 'cn'
import type { ClubTotals } from '../api'
import { nextTarget } from '../feed'

const naira = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `₦${Math.round(n / 1000)}K` : `₦${n}`

const COUNTERS: {
  key: keyof ClubTotals
  label: string
  steps: number[]
  every: number
  format?: (n: number) => string
}[] = [
  { key: 'matchdays', label: 'Matchdays on Astro', steps: [10, 25, 50], every: 50 },
  { key: 'goals', label: 'Goals scored', steps: [100, 250], every: 500 },
  { key: 'appearances', label: 'Appearances made', steps: [500, 1000], every: 1000 },
  { key: 'raised', label: 'Raised for causes', steps: [100_000, 250_000, 500_000], every: 500_000, format: naira },
  { key: 'roster', label: 'Players on the roster', steps: [25, 50], every: 50 },
]

export function ClubCounters({ totals, layout = 'grid' }: { totals: ClubTotals; layout?: 'grid' | 'strip' | 'column' }) {
  return (
    <div
      className={cn(
        'grid gap-2.5',
        layout === 'grid' && 'grid-cols-2',
        layout === 'strip' && 'grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))]',
        layout === 'column' && 'grid-cols-1',
      )}
    >
      {COUNTERS.map((c, i) => {
        const value = totals[c.key]
        const fmt = c.format ?? ((n: number) => n.toLocaleString('en-GB'))
        const { target, progress } = nextTarget(value, c.steps, c.every)
        return (
          <div
            key={c.key}
            className={cn(
              'min-w-0 rounded-[14px] border border-border bg-astro-surface-sunken px-4 py-3.5',
              layout === 'grid' && i === COUNTERS.length - 1 && 'col-span-2',
            )}
          >
            <div className="truncate font-display text-[38px] leading-[0.9] text-astro-text">{fmt(value)}</div>
            <div className="truncate text-xs text-astro-text-muted">{c.label}</div>
            <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#6d3ec9,#a63fff)]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mt-1 flex justify-between gap-2 text-[11px] text-astro-text-dim">
              <span>Next: {fmt(target)}</span>
              <span className="truncate">{fmt(target - value)} to go</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
