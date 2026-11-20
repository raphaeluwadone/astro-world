import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Scene } from '@/components/states/Scene'
import { toast } from 'sonner'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { InTheNetIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { inputKey, type RatingGame, type RatingMatchday, type RosterPlayer } from './api'
import { RatingRow } from './components/RatingRow'
import { useDoneGames, useFinishGame, useMyInputs, useMyScores, useRatingGames, useRatingMatchday, useRoster, useSubmitRating } from './hooks'
import { APP_TIMEZONE } from '@/lib/timezone'

const TEAM_ORDER = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']

function closesLabel(closesAt: string) {
  return new Date(closesAt).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIMEZONE,
  })
}

function dayLabel(playedAt: string) {
  return new Date(playedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: APP_TIMEZONE })
}

function groupByTeam(roster: RosterPlayer[], myTeamId: string | undefined) {
  const teams = new Map<string, { id: string; name: string; colour: string; players: RosterPlayer[] }>()
  for (const p of roster) {
    const team = teams.get(p.team_id) ?? { id: p.team_id, name: p.team_name, colour: p.team_colour, players: [] }
    team.players.push(p)
    teams.set(p.team_id, team)
  }
  return [...teams.values()].sort((a, b) => {
    if (a.id === myTeamId) return -1
    if (b.id === myTeamId) return 1
    return TEAM_ORDER.indexOf(a.name) - TEAM_ORDER.indexOf(b.name)
  })
}

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function dayNote(gameCount: number, wholeDay: boolean) {
  if (gameCount + Number(wholeDay) === 0) return undefined
  const parts = [gameCount > 0 && count(gameCount, 'game'), wholeDay && 'whole day'].filter(Boolean).join(' + ')
  return `Avg from ${parts}`
}

function Tab({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    // Labels widen once team names load, so re-check then too.
    if (active) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active, sub])
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'shrink-0 rounded-[11px] bg-astro-accent px-4 py-2.5 text-left text-astro-on-accent'
          : 'shrink-0 rounded-[11px] border border-border bg-astro-surface-2 px-4 py-2.5 text-left text-astro-text-muted hover:text-astro-text'
      }
    >
      <div className="text-[12.5px] font-extrabold">{title}</div>
      {sub && <div className={active ? 'text-[11px] font-bold opacity-80' : 'text-[11px] text-astro-text-dim'}>{sub}</div>}
    </button>
  )
}

function Header({ matchday, rated, total }: { matchday: RatingMatchday; rated?: number; total?: number }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          {dayLabel(matchday.playedAt)}
          {matchday.venue ? ` · ${matchday.venue}` : ''} &middot;{' '}
          {matchday.isOpen ? `ratings close ${closesLabel(matchday.closesAt)}` : 'ratings closed'}
        </div>
        <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Rate the Lot of Them</h1>
        <p className="mt-1.5 max-w-[62ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          Anonymous. Everyone&rsquo;s scores get averaged into one rating for the day, so one grudge score of 1 won&rsquo;t do
          much damage.
        </p>
      </div>
      {total !== undefined && total > 0 && (
        <div className="rounded-[14px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 px-[18px] py-3.5">
          <div className="astro-eyebrow mb-1">Rated</div>
          <div className="font-display text-[32px] leading-none text-astro-accent">
            {rated}
            <span className="text-astro-text-dim">/{total}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** For players who weren't part of the matchday while rating is limited to those who were. */
function Sideline({ matchday, roster }: { matchday: RatingMatchday; roster: RosterPlayer[] }) {
  const teams = groupByTeam(roster, undefined)
  return (
    <div className="flex flex-col gap-5">
      <div
        className="relative overflow-hidden rounded-[18px] border-[1.5px] border-[rgba(166,63,255,0.4)] px-[26px] py-6"
        style={{ background: 'linear-gradient(100deg, #2a1147 0%, #111a33 62%)' }}
      >
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-accent-soft">
          {matchday.isOpen ? 'Players only this week' : 'Ratings are in'}
        </div>
        <div className="font-display mb-1.5 text-[32px] leading-none text-astro-text">You watched this one from the sideline.</div>
        <p className="mb-5 max-w-[56ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          {matchday.isOpen
            ? `Ratings for ${dayLabel(matchday.playedAt)} are for the ${roster.length} who were there. The scores come out when voting closes ${closesLabel(matchday.closesAt)}.`
            : `Voting for ${dayLabel(matchday.playedAt)} has closed. Get on the next one and you'll have a say.`}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/matchday"
            className="rounded-[11px] bg-astro-accent px-[20px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
          >
            Get on the next one
          </Link>
          <Link
            to="/rankings"
            className="rounded-[11px] border border-white/15 px-[20px] py-3 text-sm font-bold text-astro-text hover:bg-white/[0.05]"
          >
            See the rankings
          </Link>
        </div>
      </div>

      {teams.length > 0 && (
        <div>
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Who played</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((t) => (
              <div key={t.id} className="astro-card p-4" style={{ borderColor: `color-mix(in srgb, ${t.colour} 45%, transparent)` }}>
                <div className="font-display mb-3 text-xl leading-none" style={{ color: t.colour }}>
                  Team {t.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.players.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 rounded-full bg-astro-surface-2 py-1 pl-1 pr-2.5">
                      <PlayerPhoto playerId={p.id} alt="" className="size-6 rounded-full" />
                      <span className="text-[12.5px] font-bold text-astro-text">{p.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function VotingPage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id

  const { data: matchday, isLoading, isError, refetch } = useRatingMatchday(playerId)
  const { data: roster = [] } = useRoster(matchday?.matchdayId)
  const { data: scores = new Map<string, number>() } = useMyScores(matchday?.matchdayId)
  const { data: games = [] } = useRatingGames(matchday?.matchdayId)
  const { data: inputs = new Map<string, number>() } = useMyInputs(matchday?.matchdayId)
  const { data: done = new Set<string>() } = useDoneGames(matchday?.matchdayId)
  const submit = useSubmitRating(matchday?.matchdayId)
  const finish = useFinishGame(matchday?.matchdayId)
  const [picked, setPicked] = useState<string>()

  if (isLoading || !playerId) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  if (!matchday) {
    return (
      <div>
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Ratings</div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Rate the Lot of Them</h1>
        <EmptyState icon={<Scene kind="rating" />} title="No matchday to rate yet." body="Ratings open once the first results are in." />
      </div>
    )
  }

  if (!matchday.canRate && !matchday.partOf) {
    return (
      <div>
        <Header matchday={matchday} />
        <Sideline matchday={matchday} roster={roster} />
      </div>
    )
  }

  const subjects = roster.filter((p) => p.id !== playerId)
  const myTeamId = roster.find((p) => p.id === playerId)?.team_id
  const teams = groupByTeam(subjects, myTeamId)
  const ratedCount = subjects.filter((p) => scores.has(p.id)).length
  const allRated = subjects.length > 0 && ratedCount === subjects.length
  const perGame = matchday.perGameOpen && games.length > 0
  const view = perGame ? (picked ?? games.at(-1)?.id ?? 'day') : 'day'
  const game = games.find((g) => g.id === view)
  const teamInfo = new Map(roster.map((p) => [p.team_id, { name: p.team_name, colour: p.team_colour }]))
  const byId = new Map(roster.map((p) => [p.id, p]))
  const gameLabel = (g: RatingGame) =>
    `${teamInfo.get(g.teamAId)?.name ?? '?'} ${g.scoreA}–${g.scoreB} ${teamInfo.get(g.teamBId)?.name ?? '?'}`
  const mySide = game ? game.players.get(playerId) : myTeamId
  const locked = !!game && done.has(game.id)

  function finishGame(g: RatingGame) {
    finish.mutate(g.id, {
      onSuccess: () => setPicked(games.find((x) => x.no > g.no && !done.has(x.id))?.id ?? 'day'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Couldn’t lock that game.'),
    })
  }

  function rate(subjectId: string, score: number | null, gameId?: string) {
    submit.mutate(
      { subjectId, score, gameId },
      { onError: (err) => toast.error(err instanceof Error ? err.message : 'Couldn’t save that rating.') },
    )
  }

  const sections = game
    ? [game.teamAId, game.teamBId]
        .map((teamId) => ({
          id: teamId,
          name: teamInfo.get(teamId)?.name ?? '',
          colour: teamInfo.get(teamId)?.colour ?? '#6d7496',
          players: [...game.players]
            .filter(([pid, tid]) => tid === teamId && pid !== playerId && byId.has(pid))
            .map(([pid]) => byId.get(pid)!)
            .sort((a, b) => a.nickname.localeCompare(b.nickname)),
        }))
        .sort((a, b) => Number(b.id === mySide) - Number(a.id === mySide))
    : teams

  return (
    <div>
      <Header matchday={matchday} rated={ratedCount} total={subjects.length} />

      {!matchday.partOf && matchday.canRate && (
        <div className="astro-card mb-6 px-6 py-4 text-[13px] text-astro-text-muted">
          You weren&rsquo;t on the pitch this time, but ratings are open to everyone this week. Rate whoever you saw.
        </div>
      )}

      {allRated && (
        <div className="astro-card mb-6 flex flex-wrap items-center gap-4 border-[rgba(74,222,128,0.34)] px-6 py-4">
          <InTheNetIcon />
          <div>
            <div className="text-[15px] font-bold text-astro-text">In the net.</div>
            <p className="text-[13px] text-astro-text-muted">All {subjects.length} rated. See you on the next one.</p>
          </div>
        </div>
      )}

      {perGame && (
        <div className="mb-5">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {games.map((g) => (
              <Tab
                key={g.id}
                active={view === g.id}
                onClick={() => setPicked(g.id)}
                title={done.has(g.id) ? `Game ${g.no} · done` : `Game ${g.no}`}
                sub={gameLabel(g)}
              />
            ))}
            <Tab active={view === 'day'} onClick={() => setPicked('day')} title="Whole day" sub="Everyone, one score" />
          </div>
          <p className="mt-3 text-[12.5px] text-astro-text-muted">
            {locked
              ? 'You pressed Done on this game, so these scores are locked in.'
              : game
              ? 'One score per player for this game, or skip them. Press Done when you’re finished; after that this game’s scores can’t change.'
              : 'One score for the whole day. If you rated someone game by game, this counts as one more score in their average.'}
          </p>
        </div>
      )}

      {!perGame && games.length > 0 && matchday.canRate && (
        <p className="mb-5 text-[12.5px] text-astro-text-muted">
          Game-by-game ratings closed with the matchday. Give each player a final rating for the day. Any game scores you already gave still count.
        </p>
      )}

      {sections.map((t) => (
        <div key={t.id} className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            <span className="size-2 rounded-full" style={{ background: t.colour }} />
            {t.id === mySide ? `Your side, Team ${t.name}` : `Team ${t.name}`}
          </div>
          <div className="flex flex-col gap-[11px]">
            {t.players.length === 0 && <div className="text-[12.5px] text-astro-text-dim">Nobody else to rate on this side.</div>}
            {t.players.map((p) => (
              <RatingRow
                key={p.id}
                player={p}
                score={inputs.get(inputKey(p.id, game?.id))}
                disabled={!matchday.canRate || finish.isPending}
                locked={locked}
                onRate={(score) => rate(p.id, score, game?.id)}
                avg={scores.get(p.id) ?? null}
                note={dayNote(games.filter((g) => inputs.has(inputKey(p.id, g.id))).length, inputs.has(inputKey(p.id)))}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-[26px] flex flex-wrap items-center justify-between gap-3.5 rounded-[14px] border border-border bg-astro-surface px-[22px] py-[18px]">
        <div className="text-[13px] text-astro-text-muted">
          {!matchday.canRate
            ? 'Ratings are closed for this matchday.'
            : game
            ? locked
              ? 'This game is locked in. Your final rating for each player is on Whole day.'
              : 'Scores save as you tap and count towards the average straight away. Done locks them.'
            : 'Each score saves the moment you tap it. Tap it again to take it back. Change your final rating anytime until ratings close.'}
        </div>
        {game && !locked && matchday.canRate ? (
          <button
            type="button"
            disabled={finish.isPending}
            onClick={() => finishGame(game)}
            className="shrink-0 rounded-[11px] bg-astro-accent px-[22px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {finish.isPending ? 'Locking…' : `Done with Game ${game.no}`}
          </button>
        ) : (
          <Link
            to="/matchday"
            className="shrink-0 rounded-[11px] bg-astro-accent px-[22px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
          >
            Done
          </Link>
        )}
      </div>
    </div>
  )
}
