import type { RosterPlayer } from '../api'

const SCORES = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5)

export function RatingRow({
  player,
  score,
  disabled,
  onRate,
}: {
  player: RosterPlayer
  score: number | undefined
  disabled: boolean
  onRate: (score: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-astro-surface px-[18px] py-3.5">
      <div
        className="size-11 shrink-0 rounded-[11px]"
        style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
      />
      <div className="min-w-[150px] flex-1">
        <div className="text-[15px] font-extrabold text-astro-text">{player.nickname}</div>
        <div className="text-xs text-astro-text-dim">
          {player.full_name} &middot; {player.positions.join('/') || '—'}
        </div>
      </div>
      <div className="flex flex-wrap gap-[5px]">
        {SCORES.map((v) => (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onRate(v)}
            className={score === v ? 'astro-rating astro-rating--standout' : 'astro-rating'}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
