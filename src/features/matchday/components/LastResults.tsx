import { Link } from '@tanstack/react-router'
import type { MatchResultRow } from '../api'

export function LastResults({ results }: { results: MatchResultRow[] }) {
  if (results.length === 0) {
    return <div className="text-sm text-astro-text-dim">No results recorded yet.</div>
  }

  return (
    <div className="flex flex-col gap-[9px]">
      {results.map((m) => (
        <Link
          key={m.id}
          to="/matchday/$matchId"
          params={{ matchId: m.id }}
          className="flex items-center gap-3.5 rounded-[10px] bg-astro-surface-2 px-3.5 py-3 transition-colors hover:bg-astro-accent/10"
        >
          <span className="min-w-0 flex-1 truncate text-right text-[13px] font-extrabold text-astro-text">
            {m.team_a.greek_name}
          </span>
          <span className="font-display shrink-0 rounded-lg bg-astro-bg px-3 py-[5px] text-2xl leading-none text-astro-text">
            {m.score_a}&ndash;{m.score_b}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-astro-text">
            {m.team_b.greek_name}
          </span>
        </Link>
      ))}
    </div>
  )
}
