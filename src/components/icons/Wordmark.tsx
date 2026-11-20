/** "ASTRO" in the display face, except the A is drawn without its crossbar. */
export function Wordmark({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`font-display inline-flex items-baseline ${className}`}
      style={{ fontSize: size, lineHeight: 0.9, letterSpacing: '0.04em' }}
      aria-label="Astro"
    >
      <svg
        viewBox="0 0 40 70"
        fill="currentColor"
        aria-hidden="true"
        style={{ width: '0.4em', height: '0.7em', marginRight: '0.04em', flex: '0 0 auto' }}
      >
        <path d="M13 0 H27 L40 70 H26.5 L20 30 L13.5 70 H0 Z" />
      </svg>
      <span aria-hidden="true">STRO</span>
    </span>
  )
}
