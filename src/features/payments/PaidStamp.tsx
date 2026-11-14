import { GOLD, SOFT, own } from '@/components/states/sceneKit'

const GREEN = '#4ade80'
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315]

/** The tick that lands when a payment is confirmed. */
export function PaidStamp() {
  return (
    <svg width={132} height={132} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="44" fill={GREEN} style={own('pay-halo 2.8s ease-in-out 900ms infinite')} opacity="0.35" />
      <g style={own('pay-burst 900ms cubic-bezier(.2,.8,.2,1) 420ms both')}>
        {RAYS.map((a, i) => (
          <path
            key={a}
            d="M60 8v10"
            stroke={i % 2 ? GOLD : SOFT}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${a} 60 60)`}
          />
        ))}
      </g>
      <g style={own('pay-ring 520ms cubic-bezier(.2,.8,.2,1) both')}>
        <circle cx="60" cy="60" r="34" fill="#0f2a1c" stroke={GREEN} strokeWidth="3" />
        <path
          d="M45 61l10 10 21-22"
          fill="none"
          stroke={GREEN}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          style={{ animation: 'pay-tick 420ms cubic-bezier(.6,0,.3,1) 360ms both' }}
        />
      </g>
    </svg>
  )
}
