import { Link } from '@tanstack/react-router'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { GoalTimeline } from './components/GoalTimeline'
import { Lineups } from './components/Lineups'
import { MotmCard } from './components/MotmCard'
import { RatingsPanel } from './components/RatingsPanel'
import { ScoreBanner } from './components/ScoreBanner'
import { useGoals, useLineups, useMatch, useMotmWinner, useRatingsIntegrity } from './hooks'

/** Ratings close the Saturday after the match, 23:59 Europe/London: an
 * approximation for display copy only, the real cutoff is enforced server-side. */
function ratingsStillOpen(matchPlayedAt: string) {
  const daysSince = (Date.now() - new Date(matchPlayedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince < 6
}

export function MatchPage({ matchId }: { matchId: string }) {
  const { data: match, isLoading, isError, refetch } = useMatch(matchId)
  const { data: lineups = [] } = useLineups(matchId)
  const { data: goals = [] } = useGoals(matchId)
  const { data: integrity } = useRatingsIntegrity(matchId)
  const { data: motm } = useMotmWinner(match?.matchday_id)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!match) {
    return (
      <EmptyState
        icon={<OutOfPlayIcon />}
        title="Nobody fits that."
        body="This match doesn't exist, or the link's wrong."
      />
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to="/matchday"
        className="mb-[18px] inline-flex items-center gap-[7px] text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
        </svg>
        Matchday
      </Link>

      <ScoreBanner match={match} />

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
        {motm && <MotmCard motm={motm} />}
        {integrity && <RatingsPanel integrity={integrity} isOpen={ratingsStillOpen(match.played_at)} />}
      </div>

      <Lineups match={match} rows={lineups} />

      <div className="astro-card p-6">
        <h2 className="mb-5 font-display text-[30px] leading-none text-astro-text">How It Went</h2>
        <GoalTimeline match={match} goals={goals} />
      </div>
    </div>
  )
}
