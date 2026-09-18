/**
 * "The Drum": numbered balls tumbling in a rotating drum. Reserved for the
 * one wait that deserves ceremony: Wednesday 20:00, drawing the sides.
 * Runs ~1.2s before the teams deal in.
 */
const BALLS = [
  { translate: '52.000 86.000', origin: '62px 96px', delay: '0s' },
  { translate: '70.000 90.000', origin: '80px 100px', delay: '0.16s' },
  { translate: '88.000 86.000', origin: '98px 96px', delay: '0.33s' },
  { translate: '61.000 72.000', origin: '71px 82px', delay: '0.5s' },
  { translate: '79.000 72.000', origin: '89px 82px', delay: '0.66s' },
]

export function DrumLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg width={150} height={132} viewBox="0 0 160 140" aria-hidden="true">
        <g style={{ animation: 'st-drum 9s linear infinite', transformOrigin: '80px 70px' }}>
          <circle cx="80" cy="70" r="52" fill="none" stroke="#a63fff" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M80 18v14M132 70h-14M80 122v-14M28 70h14" stroke="#a63fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="80" cy="70" r="46" fill="#0a0f1f" fillOpacity="0.55" />
        {BALLS.map((b) => (
          <g key={b.origin} style={{ animation: `st-jostle 1.1s ease-in-out infinite ${b.delay}`, transformOrigin: b.origin }}>
            <g transform={`translate(${b.translate}) scale(0.2)`}>
              <use href="#astro-ball" />
            </g>
          </g>
        ))}
      </svg>
      {label && <div className="text-[13px] font-semibold text-astro-text-muted">{label}</div>}
    </div>
  )
}
