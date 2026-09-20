import type { Player } from '../api'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[10px] bg-astro-surface-2 px-[13px] py-[11px]">
      <div className="astro-eyebrow mb-1">{label}</div>
      <div className="truncate text-[13.5px] font-bold text-astro-text">{value}</div>
    </div>
  )
}

export function InfoPanel({ player }: { player: Player }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-astro-surface p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4.5">
        <div>
          <div className="font-display text-[34px] leading-none text-astro-text">
            {player.nickname.toUpperCase()}
          </div>
          <div className="text-[13px] text-astro-text-muted">{player.full_name}</div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-astro-surface-2 px-[13px] py-2">
          {player.favourite_club_logo_url ? (
            <img src={player.favourite_club_logo_url} alt="" className="size-[26px] shrink-0 object-contain" />
          ) : (
            <div
              className="h-[30px] w-[26px]"
              style={{
                background: 'linear-gradient(150deg, #2c3c74, #182448)',
                clipPath: 'polygon(0 0, 100% 0, 100% 62%, 50% 100%, 0 62%)',
              }}
            />
          )}
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.1em] text-astro-text-dim">Club</div>
            <div className="text-[12.5px] font-bold text-astro-text">
              {player.favourite_club ?? '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Fact label="Height" value={player.height_cm ? `${player.height_cm} cm` : '—'} />
        <Fact label="Weight" value={player.weight_kg ? `${player.weight_kg} kg` : '—'} />
        <Fact label="Favourite #" value={player.favourite_number?.toString() ?? '—'} />
        <Fact label="Foot" value={player.preferred_foot ?? '—'} />
        <Fact label="Positions" value={player.positions.join(' / ') || '—'} />
        <Fact
          label="Joined"
          value={new Date(player.joined_at).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })}
        />
        <Fact label="Full name" value={player.full_name} />
      </div>

      {player.bio && (
        <p className="text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]">{player.bio}</p>
      )}
    </div>
  )
}
