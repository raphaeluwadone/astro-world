/**
 * "The Orbit": the primary loader. Ball circling with a purple arc trail,
 * spinning on its own axis as it goes. Use for page and screen loads.
 * Viewbox is fixed at 120x120; pass `size` to scale the rendered element.
 */
export function BallOrbitLoader({ size = 132, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <g style={{ animation: 'st-orbit 0.95s linear infinite', transformOrigin: '60px 60px' }}>
          <circle cx="60" cy="60" r="44" fill="none" stroke="#a63fff" strokeOpacity="0.16" strokeWidth="5" strokeLinecap="round" strokeDasharray="104 400" transform="rotate(-135 60 60)" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="#a63fff" strokeOpacity="0.34" strokeWidth="5" strokeLinecap="round" strokeDasharray="58 400" transform="rotate(-75 60 60)" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="#a63fff" strokeOpacity="0.72" strokeWidth="5" strokeLinecap="round" strokeDasharray="22 400" transform="rotate(-28 60 60)" />
          <g transform="translate(93.375 49.375) scale(0.2125)">
            <use href="#astro-ball" />
          </g>
        </g>
      </svg>
      {label && <div className="text-[13px] font-semibold text-astro-text-muted">{label}</div>}
    </div>
  )
}
