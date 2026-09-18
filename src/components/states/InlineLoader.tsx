/**
 * "The Orbit · Small": below ~24px the textured ball reads as noise, so
 * this drops to a plain ring + trailing dot. Inherits the surrounding
 * text colour (works inside a purple button or a muted row alike).
 */
export function InlineLoader({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <g style={{ animation: 'st-orbit 0.8s linear infinite', transformOrigin: '20px 20px' }}>
        <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="20 200" transform="rotate(-82 20 20)" />
        <circle cx="34" cy="20" r="4.2" fill="currentColor" />
      </g>
    </svg>
  )
}
