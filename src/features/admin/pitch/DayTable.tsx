import { StandingsTable } from '@/components/tables/StandingsTable'
import type { TeamWithMembers } from '@/features/matchday/api'
import type { PitchState } from './api'
import { dayTable } from './rotation'

/** A matchday's points: 3 a win, 1 a draw. */
export function DayTable({ teams, pitch, myTeamId, title = 'Today’s table', className }: { teams: TeamWithMembers[]; pitch: PitchState; myTeamId?: string; title?: string; className?: string }) {
  const greek = teams.map((t) => t.id)
  const rows = dayTable(pitch.session?.team_order.filter((id) => greek.includes(id)) ?? greek, pitch.games.filter((g) => g.ended_at))
  if (!rows.some((r) => r.played)) return null
  const byId = new Map(teams.map((t) => [t.id, t]))

  return (
    <section className={className} aria-label={title}>
      <h2 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">{title}</h2>
      <StandingsTable
        rows={rows.flatMap((r) => {
          const t = byId.get(r.teamId)
          return t ? [{ id: t.id, name: t.greek_name, colour: t.colour, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, goalDifference: r.goalsFor - r.goalsAgainst, points: r.points, mine: t.id === myTeamId }] : []
        })}
      />
    </section>
  )
}
