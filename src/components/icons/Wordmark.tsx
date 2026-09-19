/** The adopted AllStars wordmark: "ALL" + a round-node dash + "STARS".
 * The dash is drawn, not typed, a capsule made of two circles and a bar,
 * since no keyboard character matches it. The production source renders
 * it at every size (including the 76px landing hero) with the dash
 * filled `currentColor`, inheriting whatever colour the surrounding text
 * already has rather than a hardcoded white/purple split. */
export function Wordmark({ size = 24, className = '' }: { size?: number; className?: string }) {
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
        <circle cx="9" cy="9" r="9" fill="currentColor" />
        <rect x="9" y="5.4" width="44" height="7.2" fill="currentColor" />
        <circle cx="53" cy="9" r="9" fill="currentColor" />
      </svg>
      <span>STARS</span>
    </span>
  )
}
