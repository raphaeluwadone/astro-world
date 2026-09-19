/** The fixed "abstract ground" behind the front door, sign-in and Join
 * flow: drifting colour blooms, faint pitch geometry, and a slow sheen
 * sweep, straight from the design source. Fixed + pointer-events:none so
 * it never interferes with the form on top of it. This whole layer was
 * missing entirely until it was flagged: only the foreground cards had
 * been built, not the atmosphere behind them. */
export function JoinBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-[14%] -top-[18%] size-[62vw]"
        style={{
          background: 'radial-gradient(circle,rgba(166,63,255,0.34) 0%,rgba(166,63,255,0.08) 42%,transparent 68%)',
          animation: 'jn-bloom 19s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -right-[18%] top-[18%] size-[54vw]"
        style={{
          background: 'radial-gradient(circle,rgba(56,189,248,0.2) 0%,transparent 64%)',
          animation: 'jn-bloom 26s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[14%] size-[70vw]"
        style={{
          background: 'radial-gradient(circle,rgba(124,34,224,0.3) 0%,rgba(124,34,224,0.06) 44%,transparent 66%)',
          animation: 'jn-bloom 23s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[6%] right-[8%] size-[26vw]"
        style={{
          background: 'radial-gradient(circle,rgba(242,169,59,0.09) 0%,transparent 62%)',
          animation: 'jn-bloom 31s ease-in-out infinite reverse',
        }}
      />

      <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <g fill="none" stroke="rgba(238,240,249,0.055)" strokeWidth={2}>
          <circle cx={1010} cy={196} r={230} />
          <circle cx={1010} cy={196} r={74} />
          <path d="M-40 196H700" />
          <path d="M170 -60V430A230 230 0 0 0 630 430V-60" />
          <circle cx={240} cy={742} r={300} />
          <path d="M-60 742H40A200 200 0 0 1 440 742H1260" />
        </g>
        <g fill="none" stroke="rgba(166,63,255,0.16)" strokeWidth={2.5}>
          <path d="M840 640h320v220H840Z" />
          <path d="M900 860V760h200v100" />
        </g>
      </svg>

      <div
        className="absolute inset-[-30%]"
        style={{
          background: 'linear-gradient(115deg,transparent 44%,rgba(255,255,255,0.05) 50%,transparent 56%)',
          animation: 'jn-sheen 16s ease-in-out infinite',
        }}
      />
    </div>
  )
}
