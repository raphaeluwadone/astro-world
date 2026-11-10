import { NothingHere } from '@/components/states/NothingHere'
import { Link } from '@tanstack/react-router'
import { ScorerList } from '@/features/match/components/ScorerList'
import { useGoalsByMatch } from '@/features/match/hooks'
import type { MatchResultRow } from '../api'

export function LastResults({ results }: { results: MatchResultRow[] }) {
  const goals = useGoalsByMatch(results.map((m) => m.id))
  if (results.length === 0) {
    return <NothingHere compact body="No results recorded yet." />
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {results.map((m) => (
        <Link
          key={m.id}
          to="/matchday/$matchId"
          params={{ matchId: m.id }}
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 rounded-[10px] bg-astro-surface-2 px-3.5 py-3 transition-colors hover:bg-astro-accent/10"
        >
          <span className="min-w-0 truncate text-right text-[13px] font-extrabold text-astro-text">{m.team_a.greek_name}</span>
          <span className="font-display row-span-2 shrink-0 self-start rounded-lg bg-astro-bg px-3 py-[5px] text-2xl leading-none text-astro-text">
            {m.score_a}&ndash;{m.score_b}
          </span>
          <span className="min-w-0 truncate text-[13px] font-extrabold text-astro-text">{m.team_b.greek_name}</span>
          <ScorerList goals={goals.get(m.id)} teamId={m.team_a.id} className="min-w-0 text-right" />
          <ScorerList goals={goals.get(m.id)} teamId={m.team_b.id} className="col-start-3 min-w-0" />
        </Link>
      ))}
    </div>
  )
}
