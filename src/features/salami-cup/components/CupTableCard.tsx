import { Link } from '@tanstack/react-router'
import { StandingsTable } from '@/components/tables/StandingsTable'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useCupMatches, useCupSquads, useCurrentCup, usePastCups } from '../hooks'
import { computeCupStandings } from '../standings'
import type { TablePhase } from '@/features/matchday/components/DayTableCard'

const SHOW_AFTER_MS = 14 * 864e5

/** The Salami Cup table: the live cup while it's on, otherwise the last one played, for two weeks after. */
export function CupTableCard({ phase, className }: { phase?: TablePhase; className?: string }) {
  const { player } = useCurrentPlayer()
  const { data: current } = useCurrentCup()
  const { data: past = [] } = usePastCups()
  const cup = current?.status === 'live' || current?.status === 'played' ? current : past[0]
  const cupPhase: TablePhase = cup?.status === 'live' ? 'during' : 'after'
  const stale = !!cup && cupPhase === 'after' && Date.now() - new Date(cup.scheduled_at).getTime() > SHOW_AFTER_MS
  const show = !!cup && !stale && (!phase || phase === cupPhase)
  const { data: squads = [] } = useCupSquads(show ? cup.id : undefined)
  const { data: matches = [] } = useCupMatches(show ? cup.id : undefined)
  if (!show || squads.length === 0) return null
  const rows = computeCupStandings(squads, matches)
  if (!rows.some((r) => r.played)) return null
  const mine = new Set(squads.filter((s) => s.members.some((p) => p.id === player?.id)).map((s) => s.id))

  return (
    <section className={className ?? 'astro-card p-4'} aria-label="Salami Cup table">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-amber">Salami Cup {cup.label}</h2>
        {cupPhase === 'during' && <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-astro-red">Live</span>}
        <Link to="/salami-cup" className="ml-auto text-[11.5px] font-bold text-astro-text-muted hover:text-astro-text">
          Full cup &rarr;
        </Link>
      </div>
      <StandingsTable
        rows={rows.map((r) => ({ id: r.squadId, name: r.name, colour: r.colour, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, goalDifference: r.goalDifference, points: r.points, mine: mine.has(r.squadId) }))}
      />
    </section>
  )
}
