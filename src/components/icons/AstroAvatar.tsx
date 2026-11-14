const ORBIT_FRONT = 'M4.02 26.81 A17 6 -20 0 0 35.98 15.19'

/** Astro's avatar on system posts: the crossbar-less A inside the logo's orbit. */
export function AstroAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#0a0f1f" />
      <ellipse cx="20" cy="21" rx="17" ry="6" fill="none" stroke="#6d3ec9" strokeWidth="2.2" transform="rotate(-20 20 21)" />
      <path transform="translate(13.15 8) scale(0.343)" d="M13 0 H27 L40 70 H26.5 L20 30 L13.5 70 H0 Z" fill="#a63fff" />
      {/* Background-coloured underlay so the swoosh reads as passing in front of the A. */}
      <path d={ORBIT_FRONT} fill="none" stroke="#0a0f1f" strokeWidth="4.4" strokeLinecap="round" />
      <path d={ORBIT_FRONT} fill="none" stroke="#eef0f9" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
