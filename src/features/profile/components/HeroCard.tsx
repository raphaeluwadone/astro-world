import type { Player, PlayerTagRow } from '../api'

export function HeroCard({
  player,
  careerAvg,
  tags,
}: {
  player: Player
  careerAvg: number | null
  tags: PlayerTagRow[]
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-2 border-[rgba(166,63,255,0.45)] p-5"
      style={{
        background: 'linear-gradient(165deg, #2a1147 0%, #1b2650 42%, #111a33 100%)',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 34px), calc(100% - 34px) 100%, 0 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-[-40%]"
        style={{
          background:
            'linear-gradient(115deg, transparent 43%, rgba(255,255,255,0.1) 50%, transparent 57%)',
        }}
      />
      {player.favourite_number != null && (
        <div
          className="astro-ghost pointer-events-none absolute -right-6 top-[70px] text-[250px]"
          aria-hidden="true"
        >
          {player.favourite_number}
        </div>
      )}

      <div className="relative mb-3.5 flex items-start justify-between">
        <div>
          <div className="font-display text-[62px] leading-[0.85] text-astro-accent">
            {careerAvg ?? '—'}
          </div>
          <div className="mt-0.5 text-[11px] font-extrabold tracking-[0.14em] text-astro-text-muted">
            {player.positions.join(' / ') || '—'}
          </div>
        </div>
        {player.favourite_number != null && (
          <div className="text-right">
            <div className="font-display text-[30px] leading-none text-astro-text">
              {player.favourite_number}
            </div>
            <div className="astro-eyebrow">Fav number</div>
          </div>
        )}
      </div>

      <div
        className="relative mb-4 flex h-[250px] items-end justify-center overflow-hidden rounded-[13px]"
        style={{ background: 'linear-gradient(160deg, #2c3c74, #131c3a)' }}
      >
        <div className="h-[82%] w-[52%] rounded-t-full bg-white/[0.055]" />
        <div className="absolute inset-x-0 bottom-2.5 text-center text-[10px] font-extrabold tracking-[0.16em] text-white/30 uppercase">
          Photo pending
        </div>
      </div>

      <div className="relative">
        <div className="font-display text-[46px] leading-[0.9] text-astro-text">
          {player.nickname.toUpperCase()}
        </div>
        <div className="mb-3.5 text-[12.5px] text-astro-text-muted">
          {player.full_name}
          {player.preferred_foot ? ` · ${player.preferred_foot} foot` : ''}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t.id}
                className={
                  t.source === 'self'
                    ? 'rounded-[7px] border border-[rgba(166,63,255,0.4)] bg-[rgba(166,63,255,0.16)] px-2.5 py-1 text-[11px] font-extrabold text-astro-accent-soft'
                    : 'rounded-[7px] border border-border bg-astro-surface-2 px-2.5 py-1 text-[11px] font-bold text-astro-text-muted'
                }
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
