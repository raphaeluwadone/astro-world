import { Link } from '@tanstack/react-router'
import type { LineupRow, MatchDetail } from '../api'

function ratingBadgeColor(rating: number | null) {
  if (rating === null) return { background: '#182448', color: '#6d7496', border: 'rgba(255,255,255,0.07)' }
  if (rating >= 8) return { background: 'rgba(166,63,255,0.18)', color: '#c589ff', border: 'rgba(166,63,255,0.5)' }
  return { background: '#182448', color: '#eef0f9', border: 'rgba(255,255,255,0.07)' }
}

function TeamLineup({
  teamId,
  greekName,
  colour,
  isWinner,
  rows,
}: {
  teamId: string
  greekName: string
  colour: string
  isWinner: boolean
  rows: LineupRow[]
}) {
  const members = rows.filter((r) => r.team_id === teamId)
  return (
    <div className="rounded-2xl border border-border bg-astro-surface p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="size-[13px] shrink-0 rounded" style={{ background: colour }} />
        <span className="font-display text-[28px] leading-none text-astro-text">
          TEAM {greekName.toUpperCase()}
        </span>
        {isWinner && <span className="ml-auto text-xs text-astro-text-dim">Winners</span>}
      </div>
      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const badge = ratingBadgeColor(m.rating)
          return (
            <Link
              key={m.player_id}
              to="/players/$playerId"
              params={{ playerId: m.player_id }}
              className="flex items-center gap-3 rounded-[11px] bg-astro-surface-2 px-[13px] py-[11px] hover:bg-astro-accent/10"
            >
              <div
                className="size-[34px] shrink-0 rounded-lg"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-extrabold text-astro-text">
                  {m.players.nickname}
                </div>
                <div className="truncate text-[11px] text-astro-text-dim">
                  {m.players.full_name} &middot; {m.players.positions?.join('/')}
                </div>
              </div>
              <span
                className="font-display shrink-0 rounded-[9px] border px-[11px] py-[5px] text-xl leading-none"
                style={{ background: badge.background, color: badge.color, borderColor: badge.border }}
              >
                {m.rating ?? '—'}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Lineups({ match, rows }: { match: MatchDetail; rows: LineupRow[] }) {
  const aWins = match.score_a > match.score_b
  const bWins = match.score_b > match.score_a
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))' }}>
      <TeamLineup
        teamId={match.team_a.id}
        greekName={match.team_a.greek_name}
        colour={match.team_a.colour}
        isWinner={aWins}
        rows={rows}
      />
      <TeamLineup
        teamId={match.team_b.id}
        greekName={match.team_b.greek_name}
        colour={match.team_b.colour}
        isWinner={bWins}
        rows={rows}
      />
    </div>
  )
}
