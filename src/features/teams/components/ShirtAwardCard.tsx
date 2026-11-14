import { Link } from '@tanstack/react-router'
import { TEAM_ID } from '@/lib/teamId'
import { useCurrentCycle, useCycleStandings, useTeamCycles } from '../hooks'
import { ShirtBadge } from './ShirtBadge'

/** The team award's tile on the Awards page: last champion, and who leads this year's race. */
export function ShirtAwardCard() {
  const { data: cycles = [] } = useTeamCycles()
  const { data: cycle } = useCurrentCycle()
  const { data: table = [] } = useCycleStandings(cycle)
  const last = cycles.find((c) => c.champion)
  const leader = table.find((r) => r.played > 0)
  return (
    <Link
      to="/awards/$awardKey"
      params={{ awardKey: 'shirt-of-the-year' }}
      className="group flex items-center gap-4 rounded-2xl border border-[#f2a93b]/40 bg-[linear-gradient(135deg,rgba(242,169,59,0.14),transparent_60%)] p-4 no-underline hover:border-[#f2a93b]/70"
    >
      <ShirtBadge team={last?.champion ?? leader?.name ?? 'Alpha'} label={last?.label ?? cycle?.label ?? ''} size={64} className={last ? undefined : 'opacity-50 grayscale'} />
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#f7c25e]">Team award &middot; not for any player</div>
        <div className="font-display text-[28px] leading-none text-astro-text group-hover:underline">Shirt of the Year</div>
        <div className="mt-1 text-[12.5px] text-astro-text-muted">
          {last ? `${last.champion} hold it from ${last.label}. ` : 'Not won yet. '}
          {leader && (
            <>
              <span style={{ color: TEAM_ID.find((t) => t.name === leader.name)?.colour }} className="font-bold">
                {leader.name}
              </span>{' '}
              lead {cycle?.label} on {leader.points} pts.
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
