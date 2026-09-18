/** Icons for the state-illustration system. Each embeds the shared #astro-ball via <use>. */

export function EmptyPitchIcon() {
  return (
    <svg width={180} height={110} viewBox="0 0 220 130" aria-hidden="true">
      <rect x="14" y="16" width="192" height="98" rx="4" fill="none" stroke="#2c3c74" strokeWidth="2" />
      <path d="M110 16v98" stroke="#2c3c74" strokeWidth="2" />
      <circle cx="110" cy="65" r="21" fill="none" stroke="#2c3c74" strokeWidth="2" />
      <path d="M14 46h10v38H14M206 46h-10v38h10" fill="none" stroke="#2c3c74" strokeWidth="2" />
      <path d="M36 65h148" stroke="#3c4570" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 9" opacity="0.5" />
      <g style={{ animation: 'st-roll 4.6s ease-in-out infinite', transformOrigin: '110px 65px' }}>
        <g transform="translate(98.75 53.75) scale(0.225)">
          <use href="#astro-ball" />
        </g>
      </g>
    </svg>
  )
}

export function OutOfPlayIcon() {
  return (
    <svg width={165} height={110} viewBox="0 0 200 130" aria-hidden="true">
      <path d="M126 12v106" stroke="#2c3c74" strokeWidth="2.5" />
      <path d="M126 12v106" stroke="#a63fff" strokeOpacity="0.25" strokeWidth="7" />
      <path d="M40 74h72" stroke="#3c4570" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 9" />
      <g style={{ animation: 'st-outofplay 3.4s cubic-bezier(.3,.7,.4,1) infinite', transformOrigin: '148px 74px' }}>
        <g transform="translate(136.125 62.125) scale(0.2375)">
          <use href="#astro-ball" />
        </g>
      </g>
    </svg>
  )
}

export function OverTheBarIcon() {
  return (
    <svg width={188} height={118} viewBox="0 0 230 140" aria-hidden="true">
      <path d="M36 106 Q112 8 184 108" fill="none" stroke="#3c4570" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 10" opacity="0.5" style={{ animation: 'st-draw 2.8s ease-out infinite' }} />
      <g opacity="0.9">
        <path d="M70 118V54h74v64" fill="none" stroke="#2c3c74" strokeWidth="4" strokeLinejoin="round" />
        <path d="M70 54h74M70 70h74M70 86h74M70 102h74M86 54v64M102 54v64M118 54v64M134 54v64" stroke="#2c3c74" strokeWidth="1.4" opacity="0.55" />
        <path d="M70 54h74" stroke="#a63fff" strokeOpacity="0.5" strokeWidth="4.5" strokeLinecap="round" />
      </g>
      <path d="M40 124h164" stroke="#2c3c74" strokeWidth="2" />
      <g style={{ animation: 'st-arcover 2.8s ease-out infinite', transformOrigin: '36px 106px' }}>
        <g transform="translate(24.125 94.125) scale(0.2375)">
          <use href="#astro-ball" />
        </g>
      </g>
    </svg>
  )
}

export function InTheNetIcon() {
  return (
    <svg width={172} height={118} viewBox="0 0 210 140" aria-hidden="true">
      <g style={{ animation: 'st-netbulge 2.6s ease-out infinite', transformOrigin: '118px 78px' }}>
        <path d="M62 120V42h112v78" fill="none" stroke="#2c3c74" strokeWidth="4" strokeLinejoin="round" />
        <path d="M62 42h112M62 58h112M62 74h112M62 90h112M62 106h112M78 42v78M94 42v78M110 42v78M126 42v78M142 42v78M158 42v78" stroke="#2c3c74" strokeWidth="1.4" opacity="0.6" />
        <path d="M62 42h112" stroke="#4ade80" strokeOpacity="0.5" strokeWidth="4.5" strokeLinecap="round" />
      </g>
      <circle cx="118" cy="78" r="20" fill="none" stroke="#4ade80" strokeWidth="3" style={{ animation: 'st-ring 2.6s ease-out infinite', transformOrigin: '118px 78px' }} />
      <g style={{ animation: 'st-strike 2.6s cubic-bezier(.2,.7,.3,1) infinite', transformOrigin: '118px 78px' }}>
        <g transform="translate(105.5 65.5) scale(0.25)">
          <use href="#astro-ball" />
        </g>
      </g>
    </svg>
  )
}

export function FlatBallIcon() {
  return (
    <svg width={156} height={118} viewBox="0 0 190 140" aria-hidden="true">
      <g style={{ animation: 'st-flicker 4.2s linear infinite' }}>
        <path d="M40 22h34l10 18H30Z" fill="#2c3c74" />
        <path d="M57 40v16" stroke="#2c3c74" strokeWidth="3" />
        <path d="M30 40 L8 104 L106 104 L84 40Z" fill="#f2a93b" fillOpacity="0.12" />
      </g>
      <ellipse cx="128" cy="112" rx="30" ry="5" fill="#000" fillOpacity="0.34" />
      <g style={{ animation: 'st-sigh 3.4s ease-in-out infinite', transformOrigin: '128px 112px' }}>
        <path d="M100 112c0-13 12.5-22 28-22s28 9 28 22z" fill="#eef0f9" />
        <path d="M100 112h56" stroke="#9aa3c4" strokeWidth="2" />
        <circle cx="128" cy="100" r="5.4" fill="#0a0f1f" />
        <path d="M113 106l5-3M143 106l-5-3" stroke="#0a0f1f" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <path d="M150 84c0 0 5-5 2-9" stroke="#e0483f" strokeWidth="2.4" strokeLinecap="round" style={{ animation: 'st-escape 2.4s ease-out infinite' }} />
      <path d="M158 86c0 0 6-4 4-9" stroke="#e0483f" strokeWidth="2.4" strokeLinecap="round" style={{ animation: 'st-escape 2.4s ease-out infinite 0.7s' }} />
    </svg>
  )
}
