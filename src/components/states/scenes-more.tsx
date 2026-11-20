import { Ball } from './scenes'
import { ACCENT, CARD, DIM, GOLD, INK, LINE, SOFT, anim, own } from './sceneKit'

/** Second and third variants for each scene kind. See Scene.tsx. */

const STAR = 'M0-10L2.9-4L9.5-3.1L4.7 1.5L5.9 8.1L0 5L-5.9 8.1L-4.7 1.5L-9.5-3.1L-2.9-4Z'
const HEART = 'M0 4C-6-1-9-4-9-7a4.5 4.5 0 0 1 9-1.5A4.5 4.5 0 0 1 9-7c0 3-3 6-9 11Z'
const left = (animation: string) => ({ animation, transformBox: 'fill-box' as const, transformOrigin: '0% 50%' })

/* Bench: nothing scheduled, nobody drawn. */

export function BibsIcon() {
  const bibs: [number, string, number][] = [
    [62, ACCENT, 0],
    [105, '#38bdf8', 0.4],
    [148, '#4ade80', 0.8],
  ]
  return (
    <svg width={170} height={110} viewBox="0 0 210 130" aria-hidden="true">
      <path d="M34 26h142" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      {bibs.map(([x, colour, d]) => (
        <g key={x} style={anim(`sc-sway 3s ease-in-out infinite ${d}s backwards`, `${x}px 26px`)}>
          <path d={`M${x} 26v8`} stroke={DIM} strokeWidth="2" />
          <path
            d={`M${x - 13} 34h7q6 8 12 0h7l2 42h-30z`}
            fill={colour}
            fillOpacity="0.28"
            stroke={colour}
            strokeOpacity="0.6"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      ))}
      <path d="M30 116h150" stroke={LINE} strokeWidth="2" />
    </svg>
  )
}

export function ConesIcon() {
  return (
    <svg width={176} height={106} viewBox="0 0 220 130" aria-hidden="true">
      <path d="M16 112h188" stroke={LINE} strokeWidth="2" />
      {[50, 90, 130, 170].map((x) => (
        <g key={x} transform={`translate(${x} 112)`}>
          <path d="M-10 0L0-26L10 0Z" fill={GOLD} fillOpacity="0.7" />
          <path d="M-5.5-12h11" stroke={INK} strokeOpacity="0.7" strokeWidth="3" />
          <path d="M-13 0h26" stroke={GOLD} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <g style={anim('sc-weave 4.4s ease-in-out infinite')}>
        <Ball cx={30} cy={104} r={7} />
      </g>
    </svg>
  )
}

/* Whistle: nothing to file, review or show. */

export function StopwatchIcon() {
  return (
    <svg width={150} height={110} viewBox="0 0 180 130" aria-hidden="true">
      <rect x="84" y="16" width="12" height="9" rx="2" fill={DIM} />
      <rect x="120" y="30" width="10" height="7" rx="2" fill={DIM} transform="rotate(40 125 33)" />
      <circle cx="90" cy="72" r="40" fill={CARD} stroke={LINE} strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M90 38v6" stroke={i % 3 ? DIM : SOFT} strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${i * 30} 90 72)`} />
      ))}
      <g style={anim('sc-spin 6s steps(12) infinite', '90px 72px')}>
        <path d="M90 72V44" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <circle cx="90" cy="72" r="4.5" fill={INK} />
    </svg>
  )
}

export function ClipboardIcon() {
  return (
    <svg width={150} height={112} viewBox="0 0 180 134" aria-hidden="true">
      <rect x="52" y="20" width="76" height="100" rx="8" fill={CARD} stroke={LINE} strokeWidth="2.5" />
      <rect x="74" y="13" width="32" height="13" rx="4" fill={DIM} />
      {[44, 64, 84, 104].map((y, i) => (
        <g key={y}>
          <rect x="64" y={y - 6} width="11" height="11" rx="2.5" fill="none" stroke={DIM} strokeWidth="2" />
          <path d={`M83 ${y}h${i === 3 ? 22 : 34}`} stroke={DIM} strokeWidth="3" strokeLinecap="round" />
          <path
            d={`M66 ${y}l3 3l5-6`}
            fill="none"
            stroke="#4ade80"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14"
            style={{ animation: `sc-check 5s ease-out infinite ${i * 0.5}s backwards` }}
          />
        </g>
      ))}
    </svg>
  )
}

/* Notebook: nothing written. */

export function NewspaperIcon() {
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <ellipse cx="100" cy="114" rx="52" ry="4" fill="#000" fillOpacity="0.3" />
      <g style={anim('sc-land 4.5s cubic-bezier(.3,.7,.4,1) infinite', '100px 108px')}>
        <rect x="48" y="26" width="104" height="82" rx="4" fill="#182448" stroke={LINE} strokeWidth="2" />
        <rect x="58" y="35" width="84" height="9" rx="2" fill={ACCENT} fillOpacity="0.5" />
        <rect x="58" y="52" width="38" height="28" rx="3" fill={DIM} fillOpacity="0.6" />
        {[54, 62, 70, 78].map((y) => (
          <path key={y} d={`M104 ${y}h38`} stroke={DIM} strokeWidth="3" strokeLinecap="round" />
        ))}
        {[88, 96].map((y) => (
          <path key={y} d={`M58 ${y}h84`} stroke={DIM} strokeWidth="3" strokeLinecap="round" />
        ))}
        <path d="M100 26v82" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function CursorIcon() {
  return (
    <svg width={176} height={100} viewBox="0 0 210 120" aria-hidden="true">
      <rect x="36" y="40" width="138" height="40" rx="11" fill={CARD} stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="50" y="55" width="30" height="10" rx="3" fill={DIM} style={left('sc-word1 5s ease-out infinite')} />
      <rect x="86" y="55" width="22" height="10" rx="3" fill={DIM} style={left('sc-word2 5s ease-out infinite')} />
      <rect x="114" y="55" width="38" height="10" rx="3" fill={DIM} style={left('sc-word3 5s ease-out infinite')} />
      <g style={anim('sc-caret 5s ease-in-out infinite')}>
        <path d="M50 52v16" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'sc-blink 0.9s step-end infinite' }} />
      </g>
      <rect x="136" y="90" width="38" height="16" rx="8" fill={ACCENT} fillOpacity="0.35" />
    </svg>
  )
}

/* Chat: nobody's said anything. */

export function MegaphoneIcon() {
  return (
    <svg width={160} height={106} viewBox="0 0 200 130" aria-hidden="true">
      <g style={anim('sc-toot 3.2s ease-in-out infinite', '96px 66px')}>
        <path d="M72 76l8 26h12l-6-24" fill={DIM} />
        <path d="M60 56h14l50-22v64l-50-22H60a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6Z" fill={LINE} />
        <ellipse cx="124" cy="66" rx="7" ry="32" fill="#1b2650" stroke={DIM} strokeWidth="2" />
        <path d="M76 58v16" stroke={ACCENT} strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      </g>
      {[0, 0.16, 0.32].map((d) => (
        <path
          key={d}
          d="M140 46q14 20 0 40"
          fill="none"
          stroke={SOFT}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={anim(`sc-wave 3.2s ease-out infinite ${d}s backwards`, '132px 66px')}
        />
      ))}
    </svg>
  )
}

export function ReactionsIcon() {
  const floaters: [number, string, number][] = [
    [128, '#e0483f', 0],
    [146, '#38bdf8', 0.8],
    [136, SOFT, 1.6],
  ]
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <path d="M68 94l-8 14 20-10" fill="#182448" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      <rect x="52" y="46" width="96" height="50" rx="15" fill="#182448" stroke={LINE} strokeWidth="2" />
      <g transform="translate(100 71) scale(1.5)">
        <path d={HEART} fill="#e0483f" fillOpacity="0.8" style={own('astro-beat 1.6s ease-in-out infinite')} />
      </g>
      {floaters.map(([x, colour, d]) => (
        <g key={x} transform={`translate(${x} 44)`}>
          <path d={HEART} fill={colour} style={anim(`sc-floatup 2.4s ease-out infinite ${d}s backwards`)} />
        </g>
      ))}
    </svg>
  )
}

/* Trophy: nobody holds it. */

export function MedalIcon() {
  return (
    <svg width={150} height={112} viewBox="0 0 180 134" aria-hidden="true">
      <path d="M50 10h80" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <g style={anim('sc-sway 3.4s ease-in-out infinite', '90px 10px')}>
        <path d="M70 10l20 52 6-14-12-38Z" fill={ACCENT} fillOpacity="0.55" />
        <path d="M110 10l-20 52-6-14 12-38Z" fill="#38bdf8" fillOpacity="0.5" />
        <circle cx="90" cy="84" r="24" fill={GOLD} fillOpacity="0.22" stroke={GOLD} strokeOpacity="0.85" strokeWidth="3" />
        <circle cx="90" cy="84" r="16" fill="none" stroke={GOLD} strokeOpacity="0.4" strokeWidth="1.5" />
        <g transform="translate(90 85)">
          <path d={STAR} fill={GOLD} fillOpacity="0.8" />
        </g>
      </g>
      <g transform="translate(126 62)">
        <path d="M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z" fill={INK} style={own('sc-spark 2.4s ease-in-out infinite 0.6s backwards')} />
      </g>
    </svg>
  )
}

export function PodiumIcon() {
  const steps: [number, number, string][] = [
    [50, 72, '2'],
    [86, 56, '1'],
    [122, 84, '3'],
  ]
  return (
    <svg width={160} height={110} viewBox="0 0 200 130" aria-hidden="true">
      {steps.map(([x, y, n]) => (
        <g key={n}>
          <rect x={x} y={y} width="36" height={112 - y} rx="3" fill={n === '1' ? '#22305e' : LINE} />
          <text x={x + 18} y={y + 22} textAnchor="middle" fontSize="18" className="font-display" fill={n === '1' ? GOLD : DIM}>
            {n}
          </text>
        </g>
      ))}
      <path d="M40 112h120" stroke={LINE} strokeWidth="2" />
      <g style={anim('sc-drop 4s cubic-bezier(.3,.7,.4,1) infinite')}>
        <g transform="translate(104 44)">
          <path d={STAR} fill={GOLD} transform="scale(1.1)" />
        </g>
      </g>
    </svg>
  )
}

/* Coin jar: the kitty's empty. */

export function CoinStackIcon() {
  return (
    <svg width={150} height={110} viewBox="0 0 180 130" aria-hidden="true">
      <ellipse cx="90" cy="112" rx="34" ry="5" fill="#000" fillOpacity="0.3" />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 104 - i * 9
        return (
          <g key={i} style={{ animation: `sc-coin${i} 5s ease-out infinite` }}>
            <ellipse cx="90" cy={y + 3} rx="22" ry="6" fill="#b5741c" />
            <ellipse cx="90" cy={y} rx="22" ry="6" fill={GOLD} stroke="#fcd38a" strokeWidth="1.2" />
          </g>
        )
      })}
    </svg>
  )
}

export function WalletIcon() {
  return (
    <svg width={150} height={110} viewBox="0 0 180 130" aria-hidden="true">
      <g style={anim('sc-peek 3.6s ease-in-out infinite')}>
        <rect x="56" y="34" width="62" height="34" rx="3" fill="#4ade80" fillOpacity="0.3" stroke="#4ade80" strokeOpacity="0.5" />
        <circle cx="87" cy="51" r="7" fill="none" stroke="#4ade80" strokeOpacity="0.5" strokeWidth="1.5" />
      </g>
      <g style={anim('sc-spinflip 3.6s ease-out infinite', '128px 60px')}>
        <circle cx="128" cy="60" r="8" fill={GOLD} stroke="#fcd38a" strokeWidth="1.5" />
      </g>
      <rect x="44" y="50" width="96" height="62" rx="11" fill="#182448" stroke={LINE} strokeWidth="2.5" />
      <path d="M140 70h-26a8 8 0 0 0 0 16h26" fill={LINE} />
      <circle cx="116" cy="78" r="3.5" fill={ACCENT} />
    </svg>
  )
}

/* Magnifier: the search found nobody. */

export function BinocularsIcon() {
  return (
    <svg width={170} height={106} viewBox="0 0 210 130" aria-hidden="true">
      <path d="M20 40h170" stroke={DIM} strokeWidth="1.6" strokeDasharray="2 9" opacity="0.6" />
      {[46, 92, 140, 168].map((x) => (
        <circle key={x} cx={x} cy="34" r="3" fill={LINE} />
      ))}
      <g style={anim('sc-scan 4s ease-in-out infinite', '105px 110px')}>
        <rect x="98" y="74" width="14" height="12" rx="3" fill={DIM} />
        <circle cx="82" cy="84" r="20" fill={LINE} stroke={DIM} strokeWidth="2" />
        <circle cx="128" cy="84" r="20" fill={LINE} stroke={DIM} strokeWidth="2" />
        <circle cx="82" cy="84" r="11" fill="#0a0f1f" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
        <circle cx="128" cy="84" r="11" fill="#0a0f1f" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
        <path d="M76 79a7 7 0 0 1 6-4M122 79a7 7 0 0 1 6-4" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}

export function RadarIcon() {
  return (
    <svg width={150} height={112} viewBox="0 0 180 134" aria-hidden="true">
      {[46, 31, 16].map((r) => (
        <circle key={r} cx="90" cy="67" r={r} fill="none" stroke={LINE} strokeWidth="2" />
      ))}
      <path d="M90 21v92M44 67h92" stroke={LINE} strokeWidth="1.2" />
      <g style={anim('sc-spin 3s linear infinite', '90px 67px')}>
        <path d="M90 67V21a46 46 0 0 1 32.5 13.5Z" fill={ACCENT} fillOpacity="0.28" />
        <path d="M90 67V21" stroke={SOFT} strokeWidth="2" />
      </g>
      <circle cx="112" cy="46" r="4" fill={SOFT} style={own('sc-ping 3s ease-out infinite')} />
      <circle cx="72" cy="88" r="4" fill={SOFT} style={own('sc-ping 3s ease-out infinite 1.5s backwards')} />
    </svg>
  )
}

/* Scorecard: nothing rated. */

export function StarsIcon() {
  return (
    <svg width={170} height={90} viewBox="0 0 210 110" aria-hidden="true">
      <rect x="30" y="28" width="150" height="56" rx="14" fill={CARD} stroke={LINE} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${57 + i * 24} 57)`}>
          <path d={STAR} fill={LINE} />
          <path d={STAR} fill={GOLD} style={{ animation: `sc-star${i} 5s ease-out infinite` }} />
        </g>
      ))}
    </svg>
  )
}

export function SliderIcon() {
  return (
    <svg width={170} height={96} viewBox="0 0 210 118" aria-hidden="true">
      <rect x="40" y="30" width="130" height="62" rx="14" fill={CARD} stroke={LINE} strokeWidth="2" />
      <text x="52" y="54" fontSize="11" fontWeight="800" fill={DIM}>
        1
      </text>
      <text x="158" y="54" textAnchor="end" fontSize="11" fontWeight="800" fill={DIM}>
        10
      </text>
      <path d="M55 72h100" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
      <rect x="52" y="69" width="106" height="6" rx="3" fill={ACCENT} style={left('sc-slidefill 5s ease-in-out infinite')} />
      <g style={anim('sc-slide 5s ease-in-out infinite')}>
        <circle cx="55" cy="72" r="9" fill={INK} stroke={ACCENT} strokeWidth="2.5" />
      </g>
    </svg>
  )
}

/* Bell: all caught up. */

export function EnvelopeIcon() {
  return (
    <svg width={156} height={110} viewBox="0 0 190 134" aria-hidden="true">
      <rect x="51" y="54" width="88" height="58" rx="6" fill="#182448" stroke={LINE} strokeWidth="2" />
      <g style={anim('sc-peek 3.6s ease-in-out infinite')}>
        <rect x="61" y="44" width="68" height="48" rx="3" fill={INK} fillOpacity="0.85" />
        <path d="M70 56h34M70 64h50M70 72h42" stroke={DIM} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M51 68l44 26 44-26v38a6 6 0 0 1-6 6H57a6 6 0 0 1-6-6Z" fill="#1b2650" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="139" cy="54" r="6" fill={ACCENT} style={own('sc-ping 3.6s ease-out infinite')} />
    </svg>
  )
}

export function PaperPlaneIcon() {
  return (
    <svg width={170} height={106} viewBox="0 0 210 130" aria-hidden="true">
      <path d="M30 104C60 70 100 112 140 80S190 60 196 44" fill="none" stroke={DIM} strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" opacity="0.6" />
      <g transform="translate(70 76)">
        <g style={anim('sc-fly 4.2s ease-in-out infinite', '12px 0px')}>
          <path d="M0 0L30-12L10 4Z" fill={INK} />
          <path d="M10 4L14 13L18 -1Z" fill={SOFT} />
          <path d="M0 0L18-1" stroke={DIM} strokeWidth="1" />
        </g>
      </g>
    </svg>
  )
}

/* Calendar: no matchday on the books. */

export function HourglassIcon() {
  return (
    <svg width={140} height={112} viewBox="0 0 170 136" aria-hidden="true">
      <g style={anim('sc-hourflip 5s ease-in-out infinite', '85px 68px')}>
        <rect x="57" y="22" width="56" height="8" rx="3" fill={LINE} />
        <rect x="57" y="106" width="56" height="8" rx="3" fill={LINE} />
        <path d="M65 30h40c0 18-14 26-14 38s14 20 14 38H65c0-18 14-26 14-38S65 48 65 30Z" fill="#182448" stroke={DIM} strokeWidth="2" />
        <path d="M70 36h30L85 62Z" fill={GOLD} fillOpacity="0.75" style={anim('sc-sandtop 5s linear infinite', '85px 62px')} />
        <path d="M85 68v34" stroke={GOLD} strokeOpacity="0.8" strokeWidth="1.5" style={{ animation: 'sc-stream 5s linear infinite' }} />
        <path d="M70 104h30L85 84Z" fill={GOLD} fillOpacity="0.75" style={anim('sc-sandbot 5s linear infinite', '85px 104px')} />
      </g>
    </svg>
  )
}

export function CornerFlagIcon() {
  return (
    <svg width={156} height={110} viewBox="0 0 190 134" aria-hidden="true">
      <path d="M30 114h150" stroke={LINE} strokeWidth="2" />
      <path d="M60 114a26 26 0 0 0-26-26" fill="none" stroke={LINE} strokeWidth="2" />
      <path d="M60 114V30" stroke={INK} strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
      <g style={anim('sc-flutter 1.6s ease-in-out infinite', '60px 42px')}>
        <path d="M61 32l42 10-42 12Z" fill={ACCENT} fillOpacity="0.7" />
        <path d="M61 43l21 0" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
      </g>
      {[96, 112, 128].map((x, i) => (
        <path key={x} d={`M${x} ${96 - i * 8}q8-4 16 0`} fill="none" stroke={DIM} strokeWidth="2" strokeLinecap="round" style={anim(`sc-float 2.4s ease-in-out infinite ${i * 0.4}s backwards`)} />
      ))}
      <Ball cx={148} cy={106} r={8} />
    </svg>
  )
}

/* Goals: none recorded. */

export function OffThePostIcon() {
  return (
    <svg width={176} height={110} viewBox="0 0 220 136" aria-hidden="true">
      <path d="M128 118V40h70" fill="none" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      <path d="M128 40l14 12h56M142 52v66" stroke={LINE} strokeWidth="1.5" opacity="0.6" />
      <path d="M128 40v78" stroke={INK} strokeOpacity="0.55" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M20 124h190" stroke={LINE} strokeWidth="2" />
      <circle cx="126" cy="74" r="10" fill="none" stroke={GOLD} strokeWidth="2" style={anim('sc-ping 3s ease-out infinite', '126px 74px')} />
      <g style={anim('sc-post 3s cubic-bezier(.3,.6,.5,1) infinite')}>
        <Ball cx={34} cy={106} r={9} />
      </g>
    </svg>
  )
}

export function EmptyNetIcon() {
  return (
    <svg width={176} height={110} viewBox="0 0 220 136" aria-hidden="true">
      <path d="M52 118V36h116v82" fill="none" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      <g style={anim('sc-billow 4s ease-in-out infinite', '110px 36px')}>
        <path d="M58 40h104M58 56h104M58 72h104M58 88h104M58 104h104M74 40v76M90 40v76M106 40v76M122 40v76M138 40v76M154 40v76" stroke={LINE} strokeWidth="1.3" opacity="0.6" />
      </g>
      <path d="M30 122h160" stroke={LINE} strokeWidth="2" />
      <ellipse cx="110" cy="123" rx="14" ry="2.5" fill="#000" fillOpacity="0.35" />
      <g style={anim('sc-float 3s ease-in-out infinite')}>
        <Ball cx={110} cy={112} r={9} />
      </g>
    </svg>
  )
}
