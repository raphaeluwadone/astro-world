import { BackLink } from '@/components/navigation/BackLink'
import { PageLoader } from '@/components/states/PageLoader'
import { TeamStandingsTable } from '@/features/rankings/components/TeamStandingsTable'
import { TEAM_ID } from '@/lib/teamId'
import { RollOfChampions } from './components/RollOfChampions'
import { ShirtBadge } from './components/ShirtBadge'
import { useCurrentCycle, useCycleStandings, useTeamCycles } from './hooks'

/** The team award: it belongs to the shirt, whoever happened to be drawn into it. */
export function ShirtAwardPage() {
  const { data: cycles = [], isLoading } = useTeamCycles()
  const { data: cycle } = useCurrentCycle()
  const { data: table = [] } = useCycleStandings(cycle)
  if (isLoading) return <PageLoader />
  const last = cycles.find((c) => c.champion)
  const colour = TEAM_ID.find((t) => t.name === last?.champion)?.colour ?? '#f2a93b'
  const row = last?.final_table?.find((r) => r.name === last.champion)

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/awards" label="Awards" />
      <section
        className="astro-card flex flex-col items-center gap-4 overflow-hidden p-6 text-center md:flex-row md:text-left"
        style={{ background: `radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, ${colour} 26%, transparent), transparent 70%)` }}
      >
        <ShirtBadge team={last?.champion ?? 'Alpha'} label={last?.label ?? ''} size={150} className={last ? undefined : 'opacity-40 grayscale'} />
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f7c25e]">Team award &middot; yearly</div>
          <h1 className="mt-1 font-display text-[46px] leading-[0.95] text-astro-text md:text-[56px]">Shirt of the Year</h1>
          <p className="mt-2 max-w-[54ch] text-sm text-astro-text-muted [text-wrap:pretty]">
            Not for any player. The ballot puts different people in each shirt every Sunday, but the points stay with the shirt. Three for a win, one for a draw, and the shirt on top
            when the year closes is crowned. It earns a gold star on its name for good.
          </p>
          {last ? (
            <p className="mt-3 text-[15px] font-bold text-astro-text">
              <span style={{ color: colour }}>{last.champion}</span> are the champions of {last.label}
              {row ? `, ${row.points} pts from ${row.played} games (${row.won}-${row.drawn}-${row.lost}).` : '.'}
            </p>
          ) : (
            <p className="mt-3 text-[15px] font-bold text-astro-text">No shirt has been crowned yet.</p>
          )}
        </div>
      </section>

      {cycle && (
        <section>
          <h2 className="mb-1 font-display text-[28px] leading-none text-astro-text">The {cycle.label} race</h2>
          <p className="mb-3 text-[12.5px] text-astro-text-dim">Level on points: goal difference, goals scored, fewest conceded, then head-to-head wins.</p>
          <TeamStandingsTable standings={table} />
        </section>
      )}

      <RollOfChampions />
    </div>
  )
}
