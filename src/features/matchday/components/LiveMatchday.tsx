import { cn } from 'cn'
import { usePitch } from '@/features/admin/pitch/hooks'
import { countdown, fmtMinute, useNow } from '@/features/admin/pitch/clock'
import type { PitchGame } from '@/features/admin/pitch/api'
import { DayTable } from '@/features/admin/pitch/DayTable'
import { rotation } from '@/features/admin/pitch/rotation'
import { useCurrentPlayer } from '@/features/auth/useSession'
import type { TeamWithMembers } from '../api'
import { useDrawnTeams, useNextMatchday } from '../hooks'
import { ChampionStars } from '@/features/teams/components/ChampionStars'

const dot = (t: TeamWithMembers) => <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: t.colour }} aria-hidden />

function Scoreboard({ game, teams, myTeamId }: { game: PitchGame; teams: TeamWithMembers[]; myTeamId?: string }) {
  const running = !!game.running_since
  const now = useNow(running)
  const { over, label } = countdown(game, now)
  const side = (id: string) => teams.find((t) => t.id === id)!
  const nameOf = (id: string | null) => teams.flatMap((t) => t.members).find((m) => m.id === id)?.nickname

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 py-2">
      {[side(game.team_a_id), side(game.team_b_id)].map((t, i) => {
        const goals = game.goals.filter((g) => g.team_id === t.id)
        return (
          <div key={t.id} className={cn('row-start-1 flex min-w-0 flex-col items-center gap-1', i === 1 && 'col-start-3')}>
            <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-astro-text">
              {dot(t)}
              {t.greek_name}
              <ChampionStars team={t.greek_name} />
              {t.id === myTeamId && <span className="rounded-[4px] bg-astro-accent/25 px-1 text-[9.5px] uppercase tracking-[0.08em] text-astro-accent-soft">You</span>}
            </span>
            <span className="font-display text-[52px] leading-none tabular-nums text-astro-text">{goals.length}</span>
            {goals.length > 0 && (
              <ul className="mt-1 flex w-full flex-col items-center gap-0.5 text-center" aria-label={`${t.greek_name} scorers`}>
                {goals.map((g) => (
                  <li key={g.id} className="max-w-full text-[12.5px] leading-tight text-astro-text">
                    <span className="font-extrabold">{nameOf(g.scorer_id) ?? 'Goal'}</span>
                    {g.minute != null && (
                      <span className={cn('ml-1 text-[11px] font-extrabold', g.minute > game.length_min ? 'text-astro-red' : 'text-astro-text-dim')}>
                        {fmtMinute(g.minute, game.length_min)}
                      </span>
                    )}
                    {g.assist_id && <span className="block truncate text-[11px] text-astro-text-muted">assist {nameOf(g.assist_id)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="col-start-2 row-start-1 flex flex-col items-center pt-6">
        <span className={cn('font-display text-[26px] leading-none tabular-nums', over ? 'text-astro-red' : running ? 'text-astro-text' : 'astro-paused-blink text-astro-amber')}>{label}</span>
        <span className={cn('text-[10px] font-extrabold uppercase tracking-[0.12em]', running ? 'text-astro-text-dim' : 'text-astro-amber')}>{running ? (over ? 'Over time' : 'Left') : 'Paused'}</span>
      </div>
    </div>
  )
}

/** Live scores from Pitch-side, shown to everyone once the first game kicks off. */
export function LiveMatchday({ className, showTable = true }: { className?: string; showTable?: boolean }) {
  const { player } = useCurrentPlayer()
  const { data: matchday } = useNextMatchday()
  const drawn = matchday?.status === 'drawn' ? matchday : undefined
  const { data: teams = [] } = useDrawnTeams(drawn?.id)
  const { data: pitch } = usePitch(drawn?.id)

  if (!drawn || !pitch || pitch.games.length === 0 || teams.length < 2) return null
  const live = pitch.games.find((g) => !g.ended_at)
  const finished = pitch.games.filter((g) => g.ended_at)
  const myTeamId = teams.find((t) => t.members.some((m) => m.id === player?.id))?.id
  const greek = teams.map((t) => t.id)
  const { next } = rotation(pitch.session?.team_order.filter((id) => greek.includes(id)) ?? greek, finished, greek)
  const side = (id: string) => teams.find((t) => t.id === id)!

  return (
    <section className={cn('astro-card p-4', live && !live.running_since && 'astro-paused-glow', className)} aria-label="Live matchday">
      <div className="mb-1 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
        {live?.running_since ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-astro-red" aria-hidden />
            <span className="text-astro-red">Live</span>
          </>
        ) : live ? (
          <>
            <span className="flex h-2.5 items-center gap-[2px]" aria-hidden>
              <span className="astro-paused-bar h-2.5 w-[3px] rounded-[1px] bg-astro-amber" />
              <span className="astro-paused-bar h-2.5 w-[3px] rounded-[1px] bg-astro-amber" />
            </span>
            <span className="text-astro-amber">Paused</span>
          </>
        ) : (
          <span className="text-astro-accent-soft">Matchday</span>
        )}
        <span className="truncate text-astro-text-dim">
          {drawn.venue ?? new Date(drawn.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      {live ? (
        <Scoreboard game={live} teams={teams} myTeamId={myTeamId} />
      ) : (
        <p className="py-2 text-[13px] text-astro-text-muted">
          {next ? (
            <>
              Up next: <span className="font-extrabold text-astro-text">{side(next[0]).greek_name} v {side(next[1]).greek_name}</span>
            </>
          ) : (
            'Between games.'
          )}
        </p>
      )}
      {finished.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-white/[0.06] pt-3">
          {finished.map((g) => {
            const [a, b] = [side(g.team_a_id), side(g.team_b_id)]
            const s = (id: string) => g.goals.filter((x) => x.team_id === id).length
            const mine = g.team_a_id === myTeamId || g.team_b_id === myTeamId
            return (
              <li key={g.id} className={cn('flex items-center gap-1.5 text-[13px]', mine ? 'font-extrabold text-astro-text' : 'text-astro-text-muted')}>
                <span className="w-7 text-[11px] font-extrabold text-astro-text-dim">G{pitch.games.indexOf(g) + 1}</span>
                {dot(a)}
                {a.greek_name}
                <span className="px-1 font-display text-[17px] leading-none text-astro-text">
                  {s(a.id)}&ndash;{s(b.id)}
                </span>
                {b.greek_name}
                {dot(b)}
                <span className="ml-auto text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">FT</span>
              </li>
            )
          })}
        </ul>
      )}
      {showTable && <DayTable teams={teams} pitch={pitch} myTeamId={myTeamId} className="mt-3 border-t border-white/[0.06] pt-3" />}
    </section>
  )
}
