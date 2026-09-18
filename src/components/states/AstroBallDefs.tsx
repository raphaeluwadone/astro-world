/**
 * The Astro ball, defined once for the whole document and referenced
 * everywhere else via `<use href="#astro-ball">`. Panel positions are the
 * twelve vertex directions of an icosahedron (a real football), tilted 22°
 * then projected: see design_handoff/components/ball-3b.svg.html for the
 * geometry notes. Render this exactly once, near the document root:
 * duplicate ids from a second copy would break every `<use>` on the page.
 */
export function AstroBallDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <clipPath id="astro-ball-clip">
          <circle cx="50" cy="50" r="40" />
        </clipPath>
        <radialGradient id="astro-ball-shade" cx="32%" cy="26%" r="76%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="82%" stopColor="#0a0f1f" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#0a0f1f" stopOpacity="0.62" />
        </radialGradient>
        <g id="astro-ball">
          <circle cx="50" cy="50" r="40" fill="#eef0f9" />
          <g clipPath="url(#astro-ball-clip)">
            <g style={{ ['--amp' as string]: 39.4, transformOrigin: '50px 43.2px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '0s' }}>
              <g transform="translate(50 43.2) scale(1 0.986) translate(-50 -43.2)"><path d="M51.0 28.2L64.6 39.6L57.9 55.9L40.4 54.7L36.1 37.6Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 23.7, transformOrigin: '50px 17.8px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-1.6s' }}>
              <g transform="translate(50 17.8) scale(1 0.592) translate(-50 -17.8)"><path d="M53.8 7.3L61.2 18.2L53.1 28.6L40.7 24.1L41.2 10.9Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 23.7, transformOrigin: '50px 82.2px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '0s' }}>
              <g transform="translate(50 82.2) scale(1 0.592) translate(-50 -82.2)"><path d="M46.2 71.7L58.8 75.3L59.3 88.5L46.9 93.0L38.8 82.6Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 39.4, transformOrigin: '50px 56.8px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-1.6s' }}>
              <g transform="translate(50 56.8) scale(1 0.986) translate(-50 -56.8)"><path d="M49.0 41.8L63.9 51.2L59.6 68.3L42.1 69.5L35.4 53.2Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 24.6, transformOrigin: '50px 18.5px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-0.52s' }}>
              <g transform="translate(50 18.5) scale(1 0.615) translate(-50 -18.5)"><path d="M53.8 8.0L61.2 18.9L53.1 29.3L40.7 24.8L41.2 11.6Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 24.6, transformOrigin: '50px 81.5px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-1.08s' }}>
              <g transform="translate(50 81.5) scale(1 0.615) translate(-50 -81.5)"><path d="M46.2 71.0L58.8 74.6L59.3 87.8L46.9 92.3L38.8 81.9Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 24.6, transformOrigin: '50px 18.5px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-2.68s' }}>
              <g transform="translate(50 18.5) scale(1 0.615) translate(-50 -18.5)"><path d="M53.8 8.0L61.2 18.9L53.1 29.3L40.7 24.8L41.2 11.6Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 24.6, transformOrigin: '50px 81.5px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-2.12s' }}>
              <g transform="translate(50 81.5) scale(1 0.615) translate(-50 -81.5)"><path d="M46.2 71.0L58.8 74.6L59.3 87.8L46.9 92.3L38.8 81.9Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 39.2, transformOrigin: '50px 57.9px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-0.53s' }}>
              <g transform="translate(50 57.9) scale(1 0.98) translate(-50 -57.9)"><path d="M49.0 42.9L63.9 52.3L59.6 69.4L42.1 70.6L35.4 54.3Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 39.2, transformOrigin: '50px 42.1px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-1.07s' }}>
              <g transform="translate(50 42.1) scale(1 0.98) translate(-50 -42.1)"><path d="M51.0 27.1L64.6 38.5L57.9 54.8L40.4 53.6L36.1 36.5Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 39.2, transformOrigin: '50px 57.9px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-2.67s' }}>
              <g transform="translate(50 57.9) scale(1 0.98) translate(-50 -57.9)"><path d="M49.0 42.9L63.9 52.3L59.6 69.4L42.1 70.6L35.4 54.3Z" fill="#0a0f1f" /></g>
            </g>
            <g style={{ ['--amp' as string]: 39.2, transformOrigin: '50px 42.1px', animation: 'sph-pass 3.2s linear infinite', animationDelay: '-2.13s' }}>
              <g transform="translate(50 42.1) scale(1 0.98) translate(-50 -42.1)"><path d="M51.0 27.1L64.6 38.5L57.9 54.8L40.4 53.6L36.1 36.5Z" fill="#0a0f1f" /></g>
            </g>
          </g>
          <circle cx="50" cy="50" r="40" fill="url(#astro-ball-shade)" pointerEvents="none" />
        </g>
      </defs>
    </svg>
  )
}
