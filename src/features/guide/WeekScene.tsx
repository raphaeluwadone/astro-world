import { ACCENT, DIM, GOLD, INK, LINE, SOFT, anim, own } from '@/components/states/sceneKit'
import { Ball } from '@/components/states/scenes'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const X0 = 20
const STEP = 180 / 7
const Y = 70

/** Sunday to Sunday: the ball rolls to Wednesday's close, waits, then on to kick-off. */
export function WeekScene() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true" className="h-auto w-[min(340px,78vw)]">
      <path d={`M${X0} ${Y}h180`} stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      <path
        d={`M${X0} ${Y}h180`}
        stroke={ACCENT}
        strokeOpacity="0.7"
        strokeWidth="4"
        strokeLinecap="round"
        style={anim('gd-fill 7s cubic-bezier(.45,.05,.35,1) infinite', `${X0}px ${Y}px`)}
      />
      {DAYS.map((d, i) => {
        const x = X0 + i * STEP
        const close = i === 3
        const kickoff = i === 7
        return (
          <g key={i}>
            <circle cx={x} cy={Y} r={close || kickoff ? 5 : 3} fill={close ? GOLD : kickoff ? SOFT : DIM} />
            <text
              x={x}
              y={Y + 22}
              textAnchor="middle"
              fontSize="8"
              fontWeight="800"
              letterSpacing="0.6"
              fill={close ? GOLD : kickoff ? SOFT : DIM}
            >
              {d}
            </text>
          </g>
        )
      })}
      <circle cx={X0 + 3 * STEP} cy={Y} r="6" fill="none" stroke={GOLD} strokeWidth="2" style={own('gd-ping 7s ease-out infinite')} />
      <circle cx={X0 + 7 * STEP} cy={Y} r="6" fill="none" stroke={SOFT} strokeWidth="2" style={own('gd-kick 7s ease-out infinite')} />

      <g>
        <rect x={X0 + 3 * STEP - 20} y="26" width="40" height="16" rx="5" fill={GOLD} fillOpacity="0.16" stroke={GOLD} strokeOpacity="0.6" />
        <text x={X0 + 3 * STEP} y="37.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={GOLD}>
          20:00
        </text>
        <path d={`M${X0 + 3 * STEP} 42v14`} stroke={GOLD} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 2" />
      </g>
      <g>
        <rect x={X0 + 7 * STEP - 22} y="26" width="34" height="16" rx="5" fill={ACCENT} fillOpacity="0.18" stroke={SOFT} strokeOpacity="0.6" />
        <text x={X0 + 7 * STEP - 5} y="37.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={INK}>
          07:45
        </text>
        <path d={`M${X0 + 7 * STEP} 42v14`} stroke={SOFT} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 2" />
      </g>

      <g style={anim('gd-roll 7s cubic-bezier(.45,.05,.35,1) infinite')}>
        <Ball cx={X0} cy={Y - 13} r={8} />
      </g>
    </svg>
  )
}
