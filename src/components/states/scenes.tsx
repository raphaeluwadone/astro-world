import { useId } from 'react'
import { ACCENT, CARD, DIM, GOLD, INK, LINE, SOFT, anim, own } from './sceneKit'

/** Animated empty-state scenes, one per kind of empty. Same palette and size as icons.tsx. */

export function Ball({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const s = r / 40
  return (
    <g transform={`translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})`}>
      <use href="#astro-ball" />
    </g>
  )
}

/** Nothing scheduled, nobody drawn: the bench is empty and the ball rolls under it. */
export function EmptyBenchIcon() {
  return (
    <svg width={180} height={110} viewBox="0 0 220 130" aria-hidden="true">
      <path d="M20 112h180" stroke={LINE} strokeWidth="2" />
      <rect x="50" y="48" width="120" height="7" rx="3" fill={LINE} opacity="0.7" />
      <path d="M62 55v15M158 55v15" stroke={LINE} strokeWidth="4" />
      <g style={anim('sc-rollin 5s cubic-bezier(.25,.8,.35,1) infinite', '110px 101px')}>
        <Ball cx={110} cy={101} r={9} />
      </g>
      <rect x="50" y="70" width="120" height="8" rx="3" fill={LINE} />
      <path d="M62 78v34M158 78v34" stroke={LINE} strokeWidth="5" strokeLinecap="round" />
      <rect x="72" y="64" width="24" height="6" rx="2" fill={ACCENT} fillOpacity="0.5" />
      <rect x="74" y="59" width="20" height="5" rx="2" fill={ACCENT} fillOpacity="0.3" />
      <g style={anim('sc-wobble 5s ease-in-out infinite', '141px 70px')}>
        <rect x="136" y="50" width="10" height="20" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeOpacity="0.6" />
        <rect x="138" y="46" width="6" height="5" rx="1.5" fill="#38bdf8" fillOpacity="0.7" />
      </g>
    </svg>
  )
}

/** Nothing to file or review: the whistle goes, nobody answers. */
export function WhistleIcon() {
  return (
    <svg width={165} height={108} viewBox="0 0 200 130" aria-hidden="true">
      <path d="M66 70C52 84 46 102 30 112" fill="none" stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="66" r="5" fill="none" stroke={DIM} strokeWidth="2.5" />
      <g style={anim('sc-toot 3.2s ease-in-out infinite', '110px 70px')}>
        <path d="M92 50H148a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H104" fill={LINE} />
        <circle cx="92" cy="74" r="24" fill={LINE} />
        <circle cx="92" cy="74" r="8" fill="#0a0f1f" fillOpacity="0.6" />
        <path d="M96 50h52" stroke={ACCENT} strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      </g>
      {[0, 0.16, 0.32].map((d) => (
        <path
          key={d}
          d="M160 44q12 14 0 28"
          fill="none"
          stroke={SOFT}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={anim(`sc-wave 3.2s ease-out infinite ${d}s backwards`, '154px 58px')}
        />
      ))}
    </svg>
  )
}

/** Nothing written yet: lines appear on the page while the pencil scribbles. */
export function NotebookIcon() {
  const lines: [number, number][] = [
    [48, 130],
    [60, 130],
    [72, 124],
    [84, 130],
    [96, 112],
  ]
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <rect x="58" y="14" width="84" height="104" rx="6" fill={CARD} stroke={LINE} strokeWidth="2" />
      {[70, 82, 94, 106, 118, 130].map((x) => (
        <circle key={x} cx={x} cy="14" r="3.5" fill="#0a0f1f" stroke={DIM} strokeWidth="1.6" />
      ))}
      <rect x="70" y="28" width="40" height="6" rx="3" fill={ACCENT} fillOpacity="0.45" />
      {lines.map(([y, x2], i) => (
        <path
          key={y}
          d={`M70 ${y}H${x2}`}
          stroke={DIM}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          style={{ animation: `sc-write 6s ease-out infinite ${i * 0.7}s backwards` }}
        />
      ))}
      <g transform="translate(134 100)">
        <g style={anim('sc-scribble 0.9s ease-in-out infinite', '0px 0px')}>
          <path d="M0 0L4-10L10-6Z" fill={GOLD} />
          <path d="M4-10L30-46L36-42L10-6Z" fill={INK} />
          <path d="M30-46L34-52L40-48L36-42Z" fill="#e0483f" fillOpacity="0.8" />
        </g>
      </g>
    </svg>
  )
}

/** Nobody's said anything: someone's typing, nothing's been sent. */
export function ChatIcon() {
  return (
    <svg width={172} height={108} viewBox="0 0 210 130" aria-hidden="true">
      <g style={anim('sc-float 4s ease-in-out infinite')}>
        <path d="M44 64l-10 14 22-10" fill="#182448" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        <rect x="30" y="20" width="96" height="46" rx="14" fill="#182448" stroke={LINE} strokeWidth="2" />
        <path d="M46 37h52M46 49h34" stroke={DIM} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <path d="M164 104l12 12-2-16" fill="#2a1a52" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" />
      <rect x="88" y="64" width="92" height="42" rx="14" fill="#2a1a52" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
      {[118, 134, 150].map((cx, i) => (
        <circle key={cx} cx={cx} cy="85" r="4.5" fill={SOFT} style={own(`sc-typing 1.2s ease-in-out infinite ${i * 0.15}s backwards`)} />
      ))}
    </svg>
  )
}

/** Nobody holds it yet: the trophy waits, polished. */
export function TrophyIcon() {
  const clip = useId()
  const cup = 'M76 22H124V46a24 24 0 0 1-48 0Z'
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={cup} />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="56" rx="50" ry="42" fill={GOLD} fillOpacity="0.05" style={anim('st-breathe 4s ease-in-out infinite', '100px 56px')} />
      <path d="M76 30H66a10 10 0 0 0 10 20M124 30h10a10 10 0 0 1-10 20" fill="none" stroke={GOLD} strokeOpacity="0.8" strokeWidth="3" />
      <path d={cup} fill={GOLD} fillOpacity="0.22" stroke={GOLD} strokeOpacity="0.85" strokeWidth="3" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        <rect x="94" y="14" width="12" height="70" fill="#fff" fillOpacity="0.35" style={anim('sc-shine 3.6s ease-in-out infinite', '100px 50px')} />
      </g>
      <rect x="95" y="70" width="10" height="16" fill={GOLD} fillOpacity="0.5" />
      <rect x="80" y="86" width="40" height="8" rx="2" fill={GOLD} fillOpacity="0.6" />
      <rect x="72" y="94" width="56" height="13" rx="3" fill={LINE} />
      <ellipse cx="100" cy="116" rx="40" ry="4" fill="#000" fillOpacity="0.3" />
      {[
        [142, 22, 0],
        [56, 40, 0.8],
        [150, 64, 1.6],
      ].map(([x, y, d]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z" fill={INK} style={own(`sc-spark 2.4s ease-in-out infinite ${d}s backwards`)} />
        </g>
      ))}
    </svg>
  )
}

/** Kitty with nothing in it yet: a coin drops in. */
export function CoinJarIcon() {
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <g style={anim('sc-coindrop 2.8s cubic-bezier(.5,0,.7,1) infinite', '100px 20px')}>
        <circle cx="100" cy="20" r="8" fill={GOLD} stroke="#fcd38a" strokeWidth="1.5" />
        <circle cx="100" cy="20" r="4" fill="none" stroke="#fcd38a" strokeOpacity="0.7" strokeWidth="1.2" />
      </g>
      <g style={anim('sc-jingle 2.8s ease-out infinite', '100px 116px')}>
        <path d="M70 46Q66 46 66 54V108Q66 116 74 116H126Q134 116 134 108V54Q134 46 130 46Z" fill="#182448" stroke={LINE} strokeWidth="2.5" />
        <ellipse cx="100" cy="108" rx="22" ry="5" fill={GOLD} fillOpacity="0.45" />
        <ellipse cx="96" cy="102" rx="14" ry="4" fill={GOLD} fillOpacity="0.3" />
        <path d="M74 60v40" stroke="#fff" strokeOpacity="0.08" strokeWidth="5" strokeLinecap="round" />
        <rect x="72" y="36" width="56" height="10" rx="3" fill={LINE} />
        <rect x="90" y="39" width="20" height="3" rx="1.5" fill="#0a0f1f" />
      </g>
      <circle cx="100" cy="40" r="12" fill="none" stroke={GOLD} strokeWidth="2" style={anim('st-ring 2.8s ease-out infinite', '100px 40px')}
        opacity={0} />
    </svg>
  )
}

/** A search or filter that found nobody: the magnifier keeps looking. */
export function MagnifierIcon() {
  const dots: [number, number][] = []
  for (const y of [40, 70, 100]) for (const x of [50, 80, 110, 140, 170]) dots.push([x, y])
  return (
    <svg width={172} height={106} viewBox="0 0 210 130" aria-hidden="true">
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill={LINE} opacity="0.55" />
      ))}
      <g style={anim('sc-search 5s ease-in-out infinite')}>
        <path d="M95 75l16 16" stroke={INK} strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
        <circle cx="80" cy="60" r="20" fill={ACCENT} fillOpacity="0.1" stroke={INK} strokeOpacity="0.85" strokeWidth="4" />
        <path d="M68 52a14 14 0 0 1 10-7" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
        <text x="80" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill={SOFT}>
          ?
        </text>
      </g>
    </svg>
  )
}

/** Nothing rated yet: the scorecard flicks through possible scores. */
export function ScorecardIcon() {
  return (
    <svg width={170} height={106} viewBox="0 0 210 130" aria-hidden="true">
      <rect x="56" y="16" width="98" height="98" rx="12" fill={CARD} stroke={ACCENT} strokeOpacity="0.45" strokeWidth="2" />
      <rect x="70" y="28" width="30" height="5" rx="2.5" fill={DIM} />
      {['7.5', '9', '6'].map((v, i) => (
        <text
          key={v}
          x="105"
          y="78"
          textAnchor="middle"
          fontSize="38"
          className="font-display"
          fill={INK}
          style={i ? anim(`sc-flip 4.5s ease-out infinite ${i * 1.5}s backwards`, '105px 66px') : anim('sc-flip 4.5s ease-out infinite', '105px 66px')}
          opacity={i ? 0 : undefined}
        >
          {v}
        </text>
      ))}
      {[70, 85, 100, 115, 130].map((x) => (
        <rect key={x} x={x} y="92" width="11" height="8" rx="4" fill="#182448" stroke={LINE} strokeWidth="1.5" />
      ))}
      <rect x="70" y="92" width="11" height="8" rx="4" fill={ACCENT} style={anim('sc-pick 4.5s ease-in-out infinite')} />
      <g transform="translate(146 22)">
        <path d="M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z" fill={SOFT} style={own('sc-spark 2.2s ease-in-out infinite')} />
      </g>
    </svg>
  )
}

/** All caught up: the bell is asleep. */
export function SleepyBellIcon() {
  return (
    <svg width={150} height={106} viewBox="0 0 190 130" aria-hidden="true">
      <g style={anim('sc-rock 4s ease-in-out infinite', '95px 22px')}>
        <path
          d="M95 22c-3 0-5 2-5 5v2c-14 4-22 15-22 30v18l-8 10h70l-8-10V59c0-15-8-26-22-30v-2c0-3-2-5-5-5Z"
          fill={LINE}
          stroke={DIM}
          strokeWidth="1.5"
        />
        <path d="M78 58c0-10 5-17 12-20" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
        <circle cx="95" cy="94" r="6" fill={ACCENT} fillOpacity="0.75" />
      </g>
      <ellipse cx="95" cy="116" rx="30" ry="3.5" fill="#000" fillOpacity="0.3" />
      {[
        [130, 44, 11, 0],
        [140, 34, 13, 0.7],
        [150, 22, 15, 1.4],
      ].map(([x, y, size, d]) => (
        <text key={x} x={x} y={y} fontSize={size} fontWeight="800" fill="#6d7496" style={{ animation: `sc-zz 2.4s ease-out infinite ${d}s backwards` }}>
          z
        </text>
      ))}
    </svg>
  )
}

/** Nothing on the calendar: a date gets circled and the ball hops onto it. */
export function CalendarIcon() {
  const days: [number, number][] = []
  for (const y of [60, 78, 96]) for (const x of [68, 84, 100, 116, 132]) days.push([x, y])
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <rect x="52" y="24" width="96" height="88" rx="10" fill={CARD} stroke={LINE} strokeWidth="2" />
      <path d="M52 34a10 10 0 0 1 10-10h76a10 10 0 0 1 10 10v10H52Z" fill={LINE} />
      <rect x="72" y="16" width="5" height="14" rx="2.5" fill={DIM} />
      <rect x="123" y="16" width="5" height="14" rx="2.5" fill={DIM} />
      {days.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={DIM} opacity={x === 132 && y === 78 ? 0 : 1} />
      ))}
      <circle
        cx="132"
        cy="78"
        r="9.5"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60"
        transform="rotate(-90 132 78)"
        style={{ animation: 'sc-circle 4s ease-out infinite' }}
      />
      <g style={anim('sc-hop 4s ease-in-out infinite')}>
        <Ball cx={132} cy={78} r={5.5} />
      </g>
    </svg>
  )
}
