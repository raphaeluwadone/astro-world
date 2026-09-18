import type { MatchDetail } from '../api'

export function ScoreBanner({ match }: { match: MatchDetail }) {
  const date = new Date(match.matchdays.played_at).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const time = new Date(match.matchdays.played_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border-2 border-[rgba(166,63,255,0.45)] px-8 py-[30px] text-center"
      style={{
        background: 'linear-gradient(100deg, #2a1147 0%, #1b2650 50%, #111a33 100%)',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 34%, rgba(255,255,255,0.07) 45%, transparent 53%)',
        }}
      />
      <div className="relative">
        <div className="mb-[22px] text-[11px] font-extrabold uppercase tracking-[0.18em] text-astro-accent-soft">
          {date} &middot; {time}
          {match.matchdays.venue ? ` · ${match.matchdays.venue}` : ''}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-[clamp(18px,5vw,56px)]">
          <div className="flex min-w-[110px] flex-col items-center gap-2.5">
            <div className="size-[46px] rounded-[13px]" style={{ background: match.team_a.colour }} />
            <div className="font-display text-4xl leading-none text-astro-text">
              {match.team_a.greek_name.toUpperCase()}
            </div>
          </div>
          <div className="font-display shrink-0 whitespace-nowrap text-[clamp(52px,9vw,96px)] leading-none tracking-[0.02em] text-astro-text">
            {match.score_a}
            <span className="mx-[clamp(6px,1.4vw,14px)] text-astro-text-dim">&ndash;</span>
            {match.score_b}
          </div>
          <div className="flex min-w-[110px] flex-col items-center gap-2.5">
            <div className="size-[46px] rounded-[13px]" style={{ background: match.team_b.colour }} />
            <div className="font-display text-4xl leading-none text-astro-text">
              {match.team_b.greek_name.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
