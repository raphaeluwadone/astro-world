import { cn } from 'cn'
import type { ReactNode } from 'react'
import { usePitch } from '@/features/admin/pitch/hooks'
import { countdown, useNow } from '@/features/admin/pitch/clock'
import type { PitchGame } from '@/features/admin/pitch/api'
import { dayTable, resultOf, rotation, score } from '@/features/admin/pitch/rotation'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { TeamWithMembers } from '../api'
import { ChampionStars } from '@/features/teams/components/ChampionStars'

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function LiveLine({ game, opponent, mine }: { game: PitchGame; opponent: TeamWithMembers; mine: string }) {
  const running = !!game.running_since
  const now = useNow(running)
  const { label, over } = countdown(game, now)
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[15px] font-extrabold text-astro-text">
      <span className={cn('size-2 rounded-full', running ? 'animate-pulse bg-astro-red' : 'bg-astro-amber')} aria-hidden />
      {running ? 'On now' : 'Paused'} v {opponent.greek_name}
      <span className="font-display text-[22px] leading-none">
        {score(game, mine)}&ndash;{score(game, opponent.id)}
      </span>
      <span className={cn('text-[12px] tabular-nums', over ? 'text-astro-red' : 'text-astro-text-muted')}>
        {label} {over ? 'over' : 'left'}
      </span>
    </p>
  )
}

/** The signed-in player's matchday: their side, when they're on next, and how the day is going. */
export function MyMatchdayCard({ matchdayId, teams, playerId }: { matchdayId: string; teams: TeamWithMembers[]; playerId: string | undefined }) {
  const { data: pitch } = usePitch(matchdayId)
  const mine = teams.find((t) => t.members.some((m) => m.id === playerId))
  if (!mine || !pitch) return null

  const side = (id: string) => teams.find((t) => t.id === id)!
  const greek = teams.map((t) => t.id)
  const order = pitch.session?.team_order.filter((id) => greek.includes(id)) ?? greek
  const finished = pitch.games.filter((g) => g.ended_at)
  const live = pitch.games.find((g) => !g.ended_at)
  const rot = rotation(order, finished, greek)
  const onPitch = live ? [live.team_a_id, live.team_b_id] : (rot.next ?? [])
  // A benched stayer goes to the front, the same as the rotation does.
  const waiting = [...(rot.next ?? []), ...rot.queue].filter((id, i, all) => !onPitch.includes(id) && all.indexOf(id) === i)
  const ahead = waiting.indexOf(mine.id)

  const table = dayTable(order, finished)
  const row = table.find((r) => r.teamId === mine.id)!
  const place = table.findIndex((r) => r.teamId === mine.id) + 1
  const myGames = finished.filter((g) => g.team_a_id === mine.id || g.team_b_id === mine.id)
  const goals = pitch.games.flatMap((g) => g.goals)
  const myGoals = goals.filter((g) => g.scorer_id === playerId).reduce((n, g) => n + (g.own_goal ? -1 : 1), 0)
  const myAssists = goals.filter((g) => g.assist_id === playerId).length
  const nameOf = (id: string | null) => teams.flatMap((t) => t.members).find((m) => m.id === id)?.nickname

  let status: ReactNode
  if (live && onPitch.includes(mine.id)) {
    status = <LiveLine game={live} opponent={side(onPitch.find((id) => id !== mine.id)!)} mine={mine.id} />
  } else if (!live && onPitch.includes(mine.id)) {
    const opp = side(onPitch.find((id) => id !== mine.id)!)
    status = (
      <p className="text-[15px] font-extrabold text-astro-text">
        {finished.length === 0 ? 'You kick off game 1' : 'You’re on next'} v {opp.greek_name}
      </p>
    )
  } else if (ahead === 0) {
    status = <p className="text-[15px] font-extrabold text-astro-text">You&rsquo;re in after this game. Get warm.</p>
  } else if (ahead > 0) {
    status = (
      <p className="text-[15px] font-extrabold text-astro-text">
        {ahead} team{ahead > 1 ? 's' : ''} ahead of you <span className="font-bold text-astro-text-muted">· {ordinal(ahead + 1)} in the queue</span>
      </p>
    )
  }

  return (
    <section className="astro-card overflow-hidden" aria-label="Your day">
      <div className="p-[22px]" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${mine.colour} 22%, transparent), transparent 70%)` }}>
        <div className="mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Your day</div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-[34px] leading-none text-astro-text">
          <span className="size-3.5 rounded-full" style={{ background: mine.colour }} aria-hidden />
          {mine.greek_name}
          <ChampionStars team={mine.greek_name} />
        </h2>
        {status}

        <ol className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] font-bold" aria-label="Order of play">
          {onPitch.length === 2 && (
            <li className="flex items-center gap-1 rounded-full border border-white/[0.12] px-2.5 py-1 text-astro-text">
              <span className="text-[10px] uppercase tracking-[0.1em] text-astro-text-dim">{live ? 'Pitch' : 'Next'}</span>
              {side(onPitch[0]).greek_name} v {side(onPitch[1]).greek_name}
            </li>
          )}
          {waiting.map((id) => (
            <li
              key={id}
              className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1', id === mine.id ? 'border-transparent text-[#04121d]' : 'border-white/[0.08] text-astro-text-muted')}
              style={id === mine.id ? { background: mine.colour } : undefined}
            >
              {id !== mine.id && <span className="size-2 rounded-full" style={{ background: side(id).colour }} aria-hidden />}
              {side(id).greek_name}
              {id === mine.id && ' (you)'}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-4 border-y border-white/[0.06] text-center">
        {[
          ['Record', `${row.won}-${row.drawn}-${row.lost}`],
          ['Points', String(row.points)],
          ['Place', row.played ? `${ordinal(place)}` : '–'],
          ['You', `${myGoals}G ${myAssists}A`],
        ].map(([k, v]) => (
          <div key={k} className="px-2 py-3">
            <div className="font-display text-[22px] leading-none text-astro-text">{v}</div>
            <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">{k}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-[22px]">
        {myGames.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Your games</h3>
            <ul className="flex flex-col gap-2">
              {myGames.map((g) => {
                const opp = side(g.team_a_id === mine.id ? g.team_b_id : g.team_a_id)
                const r = resultOf(g)
                const outcome = 'draw' in r ? 'D' : r.winner === mine.id ? 'W' : 'L'
                const scorers = g.goals.filter((x) => x.team_id === mine.id).map((x) => `${nameOf(x.scorer_id) ?? 'Unknown'}${x.own_goal ? ' (OG)' : ''}`)
                return (
                  <li key={g.id} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className={cn(
                        'mt-px flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-extrabold',
                        outcome === 'W' ? 'bg-astro-green/20 text-astro-green' : outcome === 'L' ? 'bg-astro-red/20 text-astro-red' : 'bg-white/[0.08] text-astro-text-muted',
                      )}
                    >
                      {outcome}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-bold text-astro-text">
                        G{pitch.games.indexOf(g) + 1} v {opp.greek_name} &middot; {score(g, mine.id)}&ndash;{score(g, opp.id)}
                      </span>
                      {scorers.length > 0 && <span className="block text-[12px] text-astro-text-muted">{scorers.join(', ')}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Your side</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mine.members.map((m) => (
              <li key={m.id} className={cn('flex items-center gap-2 rounded-[10px] border px-2 py-1.5', m.id === playerId ? 'border-astro-accent/50' : 'border-white/[0.07]')}>
                <PlayerPhoto playerId={m.id} alt="" className="size-7 shrink-0 rounded-[7px]" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-astro-text">{m.nickname}</span>
                {pitch.checkedIn.has(m.id) && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.2" aria-label="Checked in">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
