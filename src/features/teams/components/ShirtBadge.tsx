import { TEAM_ID } from '@/lib/teamId'

/** The champion shirt's crest: a shield in the team colour with its letter, a star and the cycle on a ribbon. */
export function ShirtBadge({ team, label, size = 120, className }: { team: string; label: string; size?: number; className?: string }) {
  const t = TEAM_ID.find((x) => x.name === team) ?? TEAM_ID[0]
  return (
    <svg viewBox="0 0 120 140" width={size} height={(size * 140) / 120} className={className} role="img" aria-label={`${t.name}, champions ${label}`}>
      <path d="M60 4 70 24 92 26 76 41 80 63 60 52 40 63 44 41 28 26 50 24Z" fill="#f7c25e" transform="translate(30 -2) scale(0.5)" />
      <path d="M60 22 104 34V72c0 26-20 44-44 54C36 116 16 98 16 72V34Z" fill="#0d1428" stroke={t.colour} strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 32 95 42V72c0 20-15 35-35 44-20-9-35-24-35-44V42Z" fill={t.colour} opacity="0.16" />
      <text x="60" y="88" textAnchor="middle" fontSize="44" fontWeight="800" fill={t.colour} fontFamily="var(--font-display, sans-serif)">
        {t.glyph}
      </text>
      <path d="M8 112h104l-8 10 8 10H8l8-10Z" fill="#f2a93b" />
      <text x="60" y="126.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#20150a" textLength="84" lengthAdjust="spacingAndGlyphs">
        CHAMPIONS {label}
      </text>
    </svg>
  )
}
