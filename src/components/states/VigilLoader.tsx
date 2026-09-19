/**
 * "The Vigil": the memorial page's only loader. The ball doesn't move,
 * a single thin ring draws itself round it once, holds, then fades and
 * begins again. A ball chasing its own tail (the Orbit) reads as
 * impatient, and impatient reads as disrespectful here, so this
 * replaces every loader on that page, including inline ones.
 */
export function VigilLoader({ size = 132, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#a63fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="277"
          transform="rotate(-90 60 60)"
          style={{ animation: 'st-vigil 3.6s ease-in-out infinite' }}
        />
        <g transform="translate(38.75 38.75) scale(0.425)">
          <use href="#astro-ball" />
        </g>
      </svg>
      {label && <div className="text-[13px] font-semibold text-astro-text-muted">{label}</div>}
    </div>
  )
}

/** "The Vigil · Small": a ring breathing around a still ball, no rotation. */
export function VigilLoaderSmall({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke="#a63fff"
        strokeWidth="2.4"
        style={{ animation: 'st-breathe 2.4s ease-in-out infinite', transformOrigin: '20px 20px' }}
      />
      <circle cx="20" cy="20" r="5" fill="#eef0f9" />
    </svg>
  )
}
