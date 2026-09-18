import { useMemo, useState } from 'react'
import type { MatchRatingRow } from '../api'

function currentSeasonStart() {
  const now = new Date()
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1 // season starts 1 Aug
  return new Date(year, 7, 1)
}

function average(nums: number[]) {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

export function StatsSection({
  matchRatings,
  careerStats,
}: {
  matchRatings: MatchRatingRow[]
  careerStats: { appearances: number; goals: number; assists: number; motm: number }
}) {
  const [mode, setMode] = useState<'career' | 'season'>('career')

  const seasonStart = useMemo(() => currentSeasonStart(), [])
  const seasonRatings = useMemo(
    () => matchRatings.filter((r) => new Date(r.played_at) >= seasonStart),
    [matchRatings, seasonStart],
  )

  const active = mode === 'career' ? matchRatings : seasonRatings
  const avgRating = average(active.map((r) => r.avg_rating))

  // Career totals are exact (from dedicated queries); "this season" scopes
  // appearances/goals/assists/MOTM to the same window using rated matches
  // as the proxy, since those don't have their own season-filtered query
  // yet — close enough for now, worth a real season-scoped query later.
  const stats =
    mode === 'career'
      ? [
          { label: 'Appearances', value: careerStats.appearances },
          { label: 'Goals', value: careerStats.goals },
          { label: 'Assists', value: careerStats.assists },
          { label: 'Avg Rating', value: avgRating ?? '—' },
          { label: 'MOTM', value: careerStats.motm },
        ]
      : [
          { label: 'Appearances', value: seasonRatings.length },
          { label: 'Avg Rating', value: avgRating ?? '—' },
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
