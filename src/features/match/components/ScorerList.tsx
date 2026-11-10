import { cn } from 'cn'
import type { GoalRow } from '../api'

/** One side's goals as "Deza (Segsy), Bal", the assister in brackets. */
export function ScorerList({
  goals,
  teamId,
  stacked,
  className,
}: {
  goals: GoalRow[] | undefined
  teamId: string
  stacked?: boolean
  className?: string
}) {
  const mine = (goals ?? []).filter((g) => g.team_id === teamId)
  if (mine.length === 0) return null
  const label = (g: GoalRow) => (
    <>
      <span className="font-bold text-astro-text-muted">{g.scorer.nickname}</span>
      {g.assist && <span className="text-astro-text-dim"> ({g.assist.nickname})</span>}
    </>
  )
  if (stacked) {
    return (
      <ul className={cn('flex flex-col gap-0.5 text-[12.5px] leading-snug', className)}>
        {mine.map((g) => (
          <li key={g.id}>{label(g)}</li>
        ))}
      </ul>
    )
  }
  return (
    <span className={cn('text-[11.5px] leading-snug', className)}>
      {mine.map((g, i) => (
        <span key={g.id}>
          {i > 0 && <span className="text-astro-text-dim">, </span>}
          {label(g)}
        </span>
      ))}
    </span>
  )
}
