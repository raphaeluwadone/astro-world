import { Link } from '@tanstack/react-router'
import type { MatchHistoryRow } from '../api'

function ratingBadgeColor(rating: number) {
  if (rating >= 8) return { background: 'rgba(166,63,255,0.18)', color: '#c589ff', border: 'rgba(166,63,255,0.5)' }
  return { background: '#182448', color: '#eef0f9', border: 'rgba(255,255,255,0.07)' }
}

export function MatchHistoryList({ history }: { history: MatchHistoryRow[] }) {
  return (
    <div className="astro-card p-6">
      <h2 className="mb-4 font-display text-[30px] leading-none text-astro-text">Match History</h2>
      {history.length === 0 ? (
        <p className="text-sm text-astro-text-dim">No matches recorded yet.</p>
      ) : (
        <div className="grid gap-[9px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {history.slice(0, 6).map((h) => {
            const badge = ratingBadgeColor(h.avg_rating)
            return (
              <Link
                key={h.match_id}
                to="/matchday/$matchId"
                params={{ matchId: h.match_id }}
                className="flex min-w-0 items-center gap-3.5 rounded-[11px] bg-astro-surface-2 px-3.5 py-3 no-underline hover:bg-[#1e2c56]"
              >
                <span className="w-[46px] shrink-0 text-[11.5px] text-astro-text-dim">
                  {new Date(h.played_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace('Sept', 'Sep')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-astro-text">
                  <span style={{ color: h.team_a.colour }}>{h.team_a.greek_name}</span> vs{' '}
                  <span style={{ color: h.team_b.colour }}>{h.team_b.greek_name}</span>
                </span>
                <span className="font-display shrink-0 text-xl leading-none text-astro-text-muted">
                  {h.score_a}&ndash;{h.score_b}
                </span>
                <span
                  className="font-display shrink-0 rounded-lg border px-2.5 py-1 text-lg leading-none"
                  style={{ background: badge.background, color: badge.color, borderColor: badge.border }}
                >
                  {h.avg_rating}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
