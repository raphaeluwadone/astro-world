import type { ReactNode } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { Button } from '@/components/ui/button'
import { AvailabilityCard } from './components/AvailabilityCard'
import { DrawnTeams } from './components/DrawnTeams'
import { LastResults } from './components/LastResults'
import { StandbyQueue } from './components/StandbyQueue'
import { WhoRepliedList } from './components/WhoRepliedList'
import { useRunTeamDraw } from './draw/hooks'
import {
  useActivePlayers,
  useAvailability,
  useBallotEntries,
  useDrawnTeams,
  useLastCompleteMatchday,
  useMatchResults,
  useNextMatchday,
} from './hooks'

function formatMatchdayDate(playedAt: string) {
  return new Date(playedAt).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function MatchdayPage() {
  const { player } = useCurrentPlayer()
  const { data: matchday, isLoading: matchdayLoading } = useNextMatchday()
  const { data: lastComplete } = useLastCompleteMatchday()

  const { data: players = [] } = useActivePlayers()
  const { data: availability = [] } = useAvailability(matchday?.id)
  const { data: ballotEntries = [] } = useBallotEntries(matchday?.id)
  const { data: teams = [] } = useDrawnTeams(matchday?.id)
  const { data: results = [] } = useMatchResults(lastComplete?.id)
  const runDraw = useRunTeamDraw(matchday?.id)

  if (matchdayLoading) {
    return <p className="text-sm text-astro-text-dim">Loading&hellip;</p>
  }

  if (!matchday) {
    return (
      <div>
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          The ballot
        </div>
        <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          Matchday
        </h1>
        <p className="mt-4 text-sm text-astro-text-muted">
          No upcoming matchday has been created yet.
        </p>
      </div>
    )
  }

  const myStatus = availability.find((a) => a.player_id === player?.id)?.status ?? null
  const daysUntil = Math.round(
    (new Date(matchday.played_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  const balloted = ballotEntries.filter((e) => e.status === 'balloted')
  const standby = ballotEntries.filter((e) => e.status === 'standby')
  const inCount = availability.filter((a) => a.status === 'in').length

  return (
    <div className="space-y-5">
      <div className="mb-[26px]">
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          {formatMatchdayDate(matchday.played_at)}
          {matchday.venue ? ` · ${matchday.venue}` : ''}
        </div>
        <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          The Ballot
        </h1>
      </div>

      <AvailabilityCard
        matchdayId={matchday.id}
        playerId={player?.id ?? null}
        currentStatus={myStatus}
        isOpen={matchday.status === 'open'}
        daysUntil={daysUntil}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="astro-card min-w-0 p-[22px]">
          <WhoRepliedList players={players} availability={availability} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {matchday.status !== 'open' && (
            <div className="astro-card p-[22px]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3.5">
                <div>
                  <h2 className="mb-[5px] font-display text-[26px] leading-none text-astro-text">
                    The Draw
                  </h2>
                  <p className="text-[13px] text-astro-text-muted">
                    {teams.length > 0
                      ? `${teams.length} teams of 6, drawn.`
                      : `${balloted.length} balloted, ${standby.length} on standby.`}
                  </p>
                </div>
                {player?.is_admin && (matchday.status === 'balloted' || runDraw.isSuccess) && teams.length === 0 && (
                  <Button onClick={() => runDraw.mutate()} disabled={runDraw.isPending}>
                    {runDraw.isPending ? 'Drawing…' : 'Run the Draw'}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <InfoPill color="#4ade80" icon="check">No repeat pairings from last Sunday</InfoPill>
                <InfoPill color="#4ade80" icon="check">Teams of 6 &middot; 5 sides</InfoPill>
                <InfoPill color="#38bdf8" icon="info">
                  {inCount} marked in, {balloted.length} balloted, {standby.length} on standby
                </InfoPill>
                <InfoPill color="#38bdf8" icon="info">Rating is not used to balance sides</InfoPill>
              </div>

              {runDraw.isSuccess && (
                <p className="mt-3 text-xs text-astro-text-muted">
                  Drawn — {runDraw.data.repeatPairingsCount} repeat pairing
                  {runDraw.data.repeatPairingsCount === 1 ? '' : 's'} from last week.
                </p>
              )}
              {runDraw.isError && (
                <p className="mt-3 text-xs text-astro-red">
                  {runDraw.error instanceof Error ? runDraw.error.message : 'Something went wrong.'}
                </p>
              )}

              {teams.length === 0 && <StandbyQueue entries={ballotEntries} />}
            </div>
          )}

          {teams.length > 0 && <DrawnTeams teams={teams} />}

          {lastComplete && (
            <div className="astro-card p-[22px]">
              <h2 className="mb-4 font-display text-[26px] leading-none text-astro-text">
                Last Sunday
              </h2>
              <LastResults results={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoPill({
  color,
  icon,
  children,
}: {
  color: string
  icon: 'check' | 'info'
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-[7px] rounded-lg border border-border bg-astro-surface-2 px-[11px] py-[7px] text-xs text-astro-text-muted">
      <svg width="13" height="13" viewBox="0 0 24 24" fill={color} className="shrink-0">
        {icon === 'check' ? (
          <path d="M9.3 19 2.6 12.3l2.6-2.6 4.1 4.1L18.8 5l2.6 2.6Z" />
        ) : (
          <path
            fillRule="evenodd"
            d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm-1.3 4.6h2.6v2.4h-2.6Zm0 4h2.6v6.6h-2.6Z"
          />
        )}
      </svg>
      {children}
    </div>
  )
}
