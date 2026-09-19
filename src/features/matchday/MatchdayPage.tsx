import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { Button } from '@/components/ui/button'
import { DrumLoader } from '@/components/states/DrumLoader'
import { EmptyState } from '@/components/states/EmptyState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { useCancelMatchday } from '@/features/admin/hooks'
import { monthOf } from './api'
import { AvailabilityCard } from './components/AvailabilityCard'
import { DrawnTeams } from './components/DrawnTeams'
import { LastResults } from './components/LastResults'
import { MonthlySlots } from './components/MonthlySlots'
import { StandbyQueue } from './components/StandbyQueue'
import { WhoRepliedList } from './components/WhoRepliedList'
import { useRunTeamDraw } from './draw/hooks'
import {
  useActivePlayers,
  useAvailability,
  useBallotEntries,
  useClaimMonthlySlot,
  useDrawnTeams,
  useLastCompleteMatchday,
  useMatchResults,
  useMonthlyMembers,
  useNextMatchday,
  useRunBallotSelection,
  useUpdateMatchdayCapacity,
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
  const runBallot = useRunBallotSelection(matchday?.id)
  const updateCapacity = useUpdateMatchdayCapacity(matchday?.id)
  const cancelMatchday = useCancelMatchday(matchday?.id)
  const month = matchday ? monthOf(matchday.played_at) : undefined
  const { data: monthlyMembers = [] } = useMonthlyMembers(month)
  const claimMonthlySlot = useClaimMonthlySlot(month)

  if (matchdayLoading) {
    return <PageLoader />
  }

  if (!matchday) {
    return (
      <div>
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          The ballot
        </div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
          Matchday
        </h1>
        <EmptyState
          icon={<EmptyPitchIcon />}
          title="Nobody's said yes yet."
          body="There's no upcoming matchday on the books. Check back once the admin opens one."
        />
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
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            {formatMatchdayDate(matchday.played_at)}
            {matchday.venue ? ` · ${matchday.venue}` : ''}
          </div>
          <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
            The Ballot
          </h1>
        </div>
        {player?.is_admin && (
          <button
            type="button"
            disabled={cancelMatchday.isPending}
            onClick={() => {
              if (window.confirm("Cancel this matchday? Availability and the ballot stay recorded, but it won't be played.")) {
                cancelMatchday.mutate()
              }
            }}
            className="text-[12.5px] font-bold text-astro-text-dim hover:text-astro-red disabled:opacity-60"
          >
            Cancel matchday
          </button>
        )}
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
          {month && (
            <MonthlySlots
              members={monthlyMembers}
              monthLabel={new Date(matchday.played_at).toLocaleDateString('en-GB', { month: 'long' })}
              playerId={player?.id ?? null}
              onClaim={() => player?.id && claimMonthlySlot.mutate(player.id)}
              isClaiming={claimMonthlySlot.isPending}
            />
          )}

          {matchday.status === 'open' && (
            <div className="astro-card p-[22px]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3.5">
                <div>
                  <h2 className="mb-[5px] font-display text-[26px] leading-none text-astro-text">
                    The Ballot
                  </h2>
                  <p className="text-[13px] text-astro-text-muted">
                    First come, first served: {matchday.capacity} spots, {monthlyMembers.length} held monthly.
                  </p>
                </div>
                {player?.is_admin && !runBallot.isPending && (
                  <Button onClick={() => runBallot.mutate()} disabled={runBallot.isPending}>
                    Run the Ballot
                  </Button>
                )}
              </div>

              {player?.is_admin && (
                <div className="mb-3.5 flex items-center gap-2.5">
                  <span className="astro-eyebrow">Sides this week</span>
                  {([30, 36] as const).map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      disabled={updateCapacity.isPending}
                      onClick={() => updateCapacity.mutate(cap)}
                      className={
                        matchday.capacity === cap
                          ? 'rounded-lg bg-astro-accent px-3 py-1.5 text-xs font-extrabold text-astro-on-accent'
                          : 'rounded-lg border border-border bg-astro-surface-2 px-3 py-1.5 text-xs font-bold text-astro-text-muted'
                      }
                    >
                      {cap / 6} teams &middot; {cap}
                    </button>
                  ))}
                </div>
              )}

              {runBallot.isSuccess ? (
                <p className="text-xs text-astro-text-muted">
                  Balloted: {runBallot.data.balloted} in ({runBallot.data.monthlyIn} monthly),{' '}
                  {runBallot.data.standby} on standby.
                </p>
              ) : (
                <p className="text-xs text-astro-text-dim">
                  {inCount} marked in this week so far. Randomizing into teams happens after the ballot,
                  on game day.
                </p>
              )}
              {runBallot.isError && (
                <p className="mt-3 text-xs text-astro-red">
                  {runBallot.error instanceof Error ? runBallot.error.message : 'Something went wrong.'}
                </p>
              )}
            </div>
          )}

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
                {player?.is_admin && (matchday.status === 'balloted' || runDraw.isSuccess) && teams.length === 0 && !runDraw.isPending && (
                  <Button onClick={() => runDraw.mutate()} disabled={runDraw.isPending}>
                    Run the Draw
                  </Button>
                )}
              </div>

              {runDraw.isPending ? (
                <DrumLoader label="Drawing the sides…" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <InfoPill color="#4ade80" icon="check">No repeat pairings from last Sunday</InfoPill>
                  <InfoPill color="#4ade80" icon="check">
                    Teams of 6 &middot; {matchday.capacity / 6} sides
                  </InfoPill>
                  <InfoPill color="#38bdf8" icon="info">
                    {balloted.length} balloted, {standby.length} on standby
                  </InfoPill>
                  <InfoPill color="#38bdf8" icon="info">Rating is not used to balance sides</InfoPill>
                </div>
              )}

              {runDraw.isSuccess && (
                <p className="mt-3 text-xs text-astro-text-muted">
                  Drawn: {runDraw.data.repeatPairingsCount} repeat pairing
                  {runDraw.data.repeatPairingsCount === 1 ? '' : 's'} from last week.
                </p>
              )}
              {runDraw.isError && (
                <p className="mt-3 text-xs text-astro-red">
                  {runDraw.error instanceof Error ? runDraw.error.message : 'Something went wrong.'}
                </p>
              )}

              {teams.length === 0 && !runDraw.isPending && <StandbyQueue entries={ballotEntries} />}
            </div>
          )}

          {teams.length > 0 && <DrawnTeams teams={teams} />}

          {teams.length > 0 && matchday.status === 'drawn' && player?.is_admin && (
            <div className="astro-card flex flex-wrap items-center justify-between gap-3.5 p-[22px]">
              <div>
                <h2 className="mb-[5px] font-display text-[26px] leading-none text-astro-text">
                  Results
                </h2>
                <p className="text-[13px] text-astro-text-muted">Not filed yet. Nothing downstream moves until they are.</p>
              </div>
              <Link
                to="/admin/results"
                className="rounded-lg bg-astro-accent px-6 py-3.5 text-sm font-extrabold text-astro-on-accent no-underline"
              >
                File results
              </Link>
            </div>
          )}

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
