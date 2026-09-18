import { Link } from '@tanstack/react-router'
import type { PlayerCardRow } from '../api'

export function PlayerCard({ player }: { player: PlayerCardRow }) {
  return (
    <Link
      to="/players/$playerId"
      params={{ playerId: player.id }}
      className="astro-card--special relative block p-4"
    >
      <div className="astro-foil" />
      {player.favourite_number != null && (
        <div className="astro-ghost -right-1.5 top-[26px] text-[118px]">{player.favourite_number}</div>
      )}
      <div className="relative mb-2.5 flex items-start justify-between">
        <div>
          <div className="font-display text-4xl leading-[0.9] text-astro-accent">
            {player.avg_rating ?? '—'}
          </div>
          <div className="text-[10.5px] font-extrabold tracking-[0.12em] text-astro-text-muted">
            {player.positions.join('/') || '—'}
          </div>
        </div>
        {player.favourite_number != null && (
          <div className="text-[10.5px] font-extrabold tracking-[0.1em] text-astro-text-dim">
            #{player.favourite_number}
          </div>
        )}
      </div>

      <div
        className="relative mb-3 flex h-[112px] items-end justify-center overflow-hidden rounded-[11px]"
        style={{ background: 'linear-gradient(160deg, #243463, #131c3a)' }}
      >
        <div className="h-[78%] w-[56%] rounded-t-full bg-white/5" />
      </div>

      <div className="relative min-w-0">
        <div className="font-display truncate text-[27px] leading-none text-astro-text">
          {player.nickname}
        </div>
        <div className="mb-2.5 truncate text-[11.5px] text-astro-text-dim">{player.full_name}</div>
        {player.tags.length > 0 && (
          <div className="flex flex-wrap gap-[5px]">
            {player.tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-border bg-astro-surface-2 px-2 py-1 text-[10.5px] font-bold text-astro-text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
