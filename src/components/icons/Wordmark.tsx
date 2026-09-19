/** The adopted AllStars wordmark (rev 42 rebrand, replaces "ASTRO"):
 * "ALL" + a round-node dash + "STARS". The dash is drawn, not typed, a
 * capsule made of two circles and a bar, since no keyboard character
 * matches it. White beside the mark, purple standalone (design spec). */
export function Wordmark({
  size = 24,
  dashColor = '#eef0f9',
  className = '',
}: {
  size?: number
  dashColor?: string
  className?: string
}) {
  return (
    <span
      className={`font-display inline-flex items-center ${className}`}
      style={{ fontSize: size, lineHeight: 0.9, letterSpacing: '0.08em', gap: '0.06em' }}
    >
      <span>ALL</span>
      <svg
        viewBox="0 0 62 18"
        style={{ width: '0.72em', height: '0.209em', flex: '0 0 auto', margin: '0 0.02em' }}
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="9" fill={dashColor} />
        <rect x="9" y="5.4" width="44" height="7.2" fill={dashColor} />
        <circle cx="53" cy="9" r="9" fill={dashColor} />
      </svg>
      <span>STARS</span>
    </span>
  )
}
