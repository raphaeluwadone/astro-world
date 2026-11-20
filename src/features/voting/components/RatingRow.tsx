import type { ReactNode } from 'react'
import type { RosterPlayer } from '../api'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'

const SCORES = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5)

export function RatingRow({
  player,
  score,
  disabled,
  onRate,
  note,
  avg,
  locked,
}: {
  player: RosterPlayer
  score: number | undefined
  disabled: boolean
  /** Null when the chosen score is tapped again, to clear it. */
  onRate: (score: number | null) => void
  note?: ReactNode
  /** My running day score for this player, shown beside the scores. */
  avg?: number | null
  locked?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-astro-surface px-[18px] py-3.5">
      <PlayerPhoto playerId={player.id} alt="" className="size-11 rounded-[11px]" />
      <div className="min-w-[150px] flex-1">
        <div className="text-[15px] font-extrabold text-astro-text">{player.nickname}</div>
        <div className="text-xs text-astro-text-dim">
          {player.full_name} &middot; {player.positions.join('/') || '-'}
        </div>
        {note && <div className="mt-1 text-[11.5px] font-bold text-astro-accent-soft">{note}</div>}
      </div>
      <div className="flex min-w-0 flex-[1_1_380px] items-center gap-3">
      {locked ? (
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-border bg-astro-surface-2 px-3 py-2 text-[12px] font-bold text-astro-text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 10V7a6 6 0 0 1 12 0v3h1v12H5V10Zm3 0h6V7a3 3 0 0 0-6 0Z" />
          </svg>
          {score === undefined ? 'Skipped' : `Locked at ${score}`}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap gap-[5px]">
          {SCORES.map((v) => (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onRate(score === v ? null : v)}
              className={score === v ? 'astro-rating astro-rating--standout' : 'astro-rating'}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {avg !== undefined && (
        <div className="w-[64px] shrink-0 rounded-[10px] border border-[rgba(166,63,255,0.3)] bg-astro-surface-2 px-2 py-1.5 text-center">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">Avg</div>
          <div className="font-display text-[22px] leading-none text-astro-accent-soft">{avg === null ? '-' : avg.toFixed(1)}</div>
        </div>
      )}
      </div>
    </div>
  )
}
