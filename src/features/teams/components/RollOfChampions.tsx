import { Link } from '@tanstack/react-router'
import { TEAM_ID } from '@/lib/teamId'
import { useTeamCycles } from '../hooks'
import { ShirtBadge } from './ShirtBadge'

export function RollOfChampions() {
  const { data: cycles = [] } = useTeamCycles()
  const done = cycles.filter((c) => c.champion)
  return (
    <section className="astro-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Roll of champions</h2>
        <Link to="/awards/$awardKey" params={{ awardKey: 'shirt-of-the-year' }} className="text-xs font-bold text-astro-accent-soft">
          The award &rarr;
        </Link>
      </div>
      {done.length === 0 ? (
        <p className="text-[13px] text-astro-text-muted">No shirt has been crowned yet. The first champion is decided when this year&rsquo;s race ends.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {done.map((c) => {
            const row = c.final_table?.find((r) => r.name === c.champion)
            const colour = TEAM_ID.find((t) => t.name === c.champion)?.colour
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <ShirtBadge team={c.champion!} label={c.label} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[22px] leading-none" style={{ color: colour }}>
                    {c.champion}
                  </div>
                  <div className="text-[12px] text-astro-text-muted">{c.label}</div>
                </div>
                {row && (
                  <div className="text-right text-[12px] text-astro-text-muted">
                    <div className="font-display text-[20px] leading-none text-astro-text">{row.points} pts</div>
                    {row.won}-{row.drawn}-{row.lost}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
