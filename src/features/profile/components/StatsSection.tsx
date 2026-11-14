import { useMemo, useState } from 'react'
import { currentSeasonStart } from '@/lib/season'
import type { MatchRatingRow } from '../api'

function average(nums: number[]) {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

type Totals = { appearances: number; goals: number; assists: number; motm: number; ownGoals: number; yellows: number; reds: number }

export function StatsSection({
  matchRatings,
  careerStats,
  seasonStats,
}: {
  matchRatings: MatchRatingRow[]
  careerStats: Totals
  seasonStats: Totals | undefined
}) {
  const [mode, setMode] = useState<'career' | 'season'>('career')

  const seasonStart = useMemo(() => currentSeasonStart(), [])
  const seasonRatings = useMemo(
    () => matchRatings.filter((r) => new Date(r.played_at) >= seasonStart),
    [matchRatings, seasonStart],
  )

  const avgRating = average((mode === 'career' ? matchRatings : seasonRatings).map((r) => r.avg_rating))
  const totals = mode === 'career' ? careerStats : seasonStats
  const show = (n: number | undefined) => n ?? '·'

  const stats = [
    { label: 'Appearances', value: show(totals?.appearances) },
    { label: 'Goals', value: show(totals?.goals) },
    { label: 'Own goals', value: show(totals?.ownGoals) },
    { label: 'Assists', value: show(totals?.assists) },
    { label: 'Avg Rating', value: avgRating ?? '-' },
    { label: 'MOTM', value: show(totals?.motm) },
    { label: 'Yellow cards', value: show(totals?.yellows) },
    { label: 'Red cards', value: show(totals?.reds) },
  ]

  return (
    <div className="astro-card p-6">
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3.5">
        <h2 className="font-display text-[30px] leading-none text-astro-text">Statistics</h2>
        <div className="flex gap-1 rounded-[11px] bg-astro-surface-2 p-1">
          <button
            type="button"
            onClick={() => setMode('career')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${mode === 'career' ? 'bg-astro-accent text-astro-on-accent' : 'text-astro-text-dim'}`}
          >
            Career
          </button>
          <button
            type="button"
            onClick={() => setMode('season')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${mode === 'season' ? 'bg-astro-accent text-astro-on-accent' : 'text-astro-text-dim'}`}
          >
            This Season
          </button>
        </div>
      </div>
      <div className="mb-4 text-[12.5px] text-astro-text-dim">
        {mode === 'career' ? 'Every match, since joining.' : 'Since 1 August.'}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))' }}>
        {stats.map((s) => (
          <div key={s.label} className="astro-tile">
            <div className="astro-tile__label">{s.label}</div>
            <div className="astro-tile__value">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
