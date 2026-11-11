import { cn } from 'cn'

export interface StandingsRow {
  id: string
  name: string
  colour: string
  played: number
  won: number
  drawn: number
  lost: number
  goalDifference: number
  points: number
  mine?: boolean
}

/** Narrow containers drop W/D/L/GD and keep the team, games played and points. */
export function StandingsTable({ rows, className }: { rows: StandingsRow[]; className?: string }) {
  const th = 'w-7 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-astro-text-dim'
  const wide = 'hidden @[16rem]:table-cell'
  return (
    <div className="@container">
    <table className={cn('w-full text-[13px]', className)}>
      <thead>
        <tr>
          <th className="text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-astro-text-dim">Team</th>
          <th className={th}>P</th>
          <th className={cn(th, wide)}>W</th>
          <th className={cn(th, wide)}>D</th>
          <th className={cn(th, wide)}>L</th>
          <th className={cn(th, wide)}>GD</th>
          <th className={cn(th, 'w-9')}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className={cn('border-t border-white/[0.06]', r.mine ? 'font-extrabold text-astro-text' : 'text-astro-text-muted')}>
            <td className="max-w-0 py-1.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: r.colour }} aria-hidden />
                <span className="truncate">{r.name}</span>
              </span>
            </td>
            <td className="text-right tabular-nums">{r.played}</td>
            <td className={cn('text-right tabular-nums', wide)}>{r.won}</td>
            <td className={cn('text-right tabular-nums', wide)}>{r.drawn}</td>
            <td className={cn('text-right tabular-nums', wide)}>{r.lost}</td>
            <td className={cn('text-right tabular-nums', wide)}>
              {r.goalDifference > 0 ? '+' : ''}
              {r.goalDifference}
            </td>
            <td className="text-right font-display text-[16px] tabular-nums text-astro-text">{r.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
