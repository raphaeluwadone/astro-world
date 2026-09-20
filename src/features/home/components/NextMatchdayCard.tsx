import { Link } from '@tanstack/react-router'
import type { StandbyEntryRow, WeeklyClaimRow } from '@/features/matchday/api'
import type { Database } from '@/types/database'

type Matchday = Database['public']['Tables']['matchdays']['Row']

export function NextMatchdayCard({
  matchday,
  weeklyClaims,
  standby,
  monthlyCount,
  playerId,
  hasWeeklyClaim,
  isOnStandby,
}: {
  matchday: Matchday
  weeklyClaims: WeeklyClaimRow[]
  standby: StandbyEntryRow[]
  monthlyCount: number
  playerId: string | null
  hasWeeklyClaim: boolean
  isOnStandby: boolean
}) {
  const filled = monthlyCount + weeklyClaims.length

  const kickoff = new Date(matchday.played_at).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const kickoffTime = new Date(matchday.played_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="astro-card p-[22px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Next Matchday</h2>
        <div className="text-xs text-astro-text-dim">
          {kickoff} &middot; {kickoffTime}
        </div>
      </div>
      <div className="mb-3.5 rounded-xl bg-astro-surface-2 p-4">
        <div className="mb-2.5 text-xs text-astro-text-muted">
          {matchday.venue ?? 'Venue TBC'} &middot; 5-a-side
        </div>
        <div className="mb-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-astro-bg">
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, (filled / matchday.capacity) * 100)}%`,
                background: 'linear-gradient(90deg, #7c22e0, #a63fff)',
              }}
            />
          </div>
          <div className="font-display text-2xl leading-none text-astro-text">
            {filled}
            <span className="text-astro-text-dim">/{matchday.capacity}</span>
          </div>
        </div>
        <div className="text-[12.5px] text-astro-text-muted">
          {monthlyCount} held monthly &middot; {standby.length} on standby
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] text-astro-text-muted">
          {!playerId ? (
            'Sign in to claim a spot'
          ) : hasWeeklyClaim ? (
            <>
              You&rsquo;re <span className="font-extrabold text-[#4ade80]">IN</span>
            </>
          ) : isOnStandby ? (
            <>
              You&rsquo;re on <span className="font-extrabold text-astro-text">STANDBY</span>
            </>
          ) : (
            "You haven't claimed a spot yet"
          )}
        </div>
        <Link to="/matchday" className="text-[13px] font-extrabold text-astro-accent">
          Ballot &rarr;
        </Link>
      </div>
    </div>
  )
}
