import { Link } from '@tanstack/react-router'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon, InTheNetIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { RatingRow } from './components/RatingRow'
import { useMyMatchToRate, useMyScores, useRatingsOpen, useRoster, useSubmitRating } from './hooks'

export function VotingPage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: match, isLoading: matchLoading, isError: matchError, refetch: refetchMatch } = useMyMatchToRate(playerId ?? undefined)
  const { data: isOpen = false } = useRatingsOpen(match?.matchId)
  const { data: roster = [] } = useRoster(match?.matchId)
  const { data: scores = new Map<string, number>() } = useMyScores(match?.matchId)
  const submit = useSubmitRating(match?.matchId, playerId ?? undefined)

  if (matchLoading) {
    return <PageLoader />
  }

  if (matchError) {
    return <ErrorState onRetry={() => refetchMatch()} />
  }

  if (!match) {
    return (
      <div>
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          Ratings
        </div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          Rate the Lot of Them
        </h1>
        <EmptyState
          icon={<EmptyPitchIcon />}
          title="No match to rate yet."
          body="You'll see this once you've played one."
        />
      </div>
    )
  }

  const subjects = roster.filter((p) => p.id !== playerId)
  const myTeamPlayers = subjects.filter((p) => p.team_id === match.myTeam.id)
  const oppTeamPlayers = subjects.filter((p) => p.team_id === match.oppTeam.id)
  const ratedCount = subjects.filter((p) => scores.has(p.id)).length
  const allRated = subjects.length > 0 && ratedCount === subjects.length

  const closesLabel = new Date(match.playedAt).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            {closesLabel} &middot; {isOpen ? 'ratings close Sat 23:59' : 'ratings closed'}
          </div>
          <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
            Rate the Lot of Them
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-sm text-astro-text-muted [text-wrap:pretty]">
            Anonymous. Everyone's scores get averaged into one match rating, so one grudge 1 won't
            do much damage.
          </p>
        </div>
        <div className="rounded-[14px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 px-[18px] py-3.5">
          <div className="astro-eyebrow mb-1">Rated</div>
          <div className="font-display text-[32px] leading-none text-astro-accent">
            {ratedCount}
            <span className="text-astro-text-dim">/{subjects.length}</span>
          </div>
        </div>
      </div>

      {allRated && (
        <div className="astro-card mb-6 flex flex-wrap items-center gap-4 border-[rgba(74,222,128,0.34)] px-6 py-4">
          <InTheNetIcon />
          <div>
            <div className="text-[15px] font-bold text-astro-text">In the net.</div>
            <p className="text-[13px] text-astro-text-muted">
              All {subjects.length} rated. See you Sunday.
            </p>
          </div>
        </div>
      )}

      {myTeamPlayers.length > 0 && (
        <>
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            Your side, Team {match.myTeam.greek_name}
          </div>
          <div className="mb-7 flex flex-col gap-[11px]">
            {myTeamPlayers.map((p) => (
              <RatingRow
                key={p.id}
                player={p}
                score={scores.get(p.id)}
                disabled={!isOpen || !playerId}
                onRate={(score) => submit.mutate({ subjectId: p.id, score })}
              />
            ))}
          </div>
        </>
      )}

      {oppTeamPlayers.length > 0 && (
        <>
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            Against you, Team {match.oppTeam.greek_name}
          </div>
          <div className="flex flex-col gap-[11px]">
            {oppTeamPlayers.map((p) => (
              <RatingRow
                key={p.id}
                player={p}
                score={scores.get(p.id)}
                disabled={!isOpen || !playerId}
                onRate={(score) => submit.mutate({ subjectId: p.id, score })}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-[26px] flex flex-wrap items-center justify-between gap-3.5 rounded-[14px] border border-border bg-astro-surface px-[22px] py-[18px]">
        <div className="text-[13px] text-astro-text-muted">
          {isOpen
            ? 'Each score saves the moment you tap it. Change your mind anytime until ratings close.'
            : 'Ratings are closed for this match.'}
        </div>
        <Link
          to="/matchday"
          className="shrink-0 rounded-[11px] bg-astro-accent px-[22px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
        >
          Done
        </Link>
      </div>
    </div>
  )
}
