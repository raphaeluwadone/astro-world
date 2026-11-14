import type { SVGProps } from 'react'

/**
 * Solid-silhouette nav icons, lifted from the approved design prototype
 * (design_handoff_astro/Astro App.dc.html) so the scaffold matches the
 * spec exactly: fill-based, no strokes, 24x24 viewBox.
 */

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M12 2.4 1.6 11.3h3.1v10.3h14.6V11.3h3.1ZM9.8 13h4.4v3.4H9.8Z" />
    </svg>
  )
}

export function MatchdayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M2.4 4h19.2v16H2.4ZM4.6 6.2v11.6H11V6.2ZM13 6.2v11.6h6.4V6.2Z" />
    </svg>
  )
}

export function CommunityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M2.8 3.8h18.4v11.6H9.4L4.4 20.2v-4.8H2.8Z" />
    </svg>
  )
}

export function PlayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M4 2.8h16v14.6L16.2 21H4ZM12 6a2.8 2.8 0 1 0 0 5.6A2.8 2.8 0 0 0 12 6ZM7.4 17.8c.6-2.2 2.4-3.4 4.6-3.4s4 1.2 4.6 3.4Z"
      />
    </svg>
  )
}

export function RankingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 12.6h4.6v8.8H3ZM9.7 6.2h4.6v15.2H9.7ZM16.4 9.6H21v11.8h-4.6Z" />
    </svg>
  )
}

/** Unlike every sibling here, this one is always amber in the design
 * (`fill="#f2a93b"` hardcoded in the source), not currentColor: the
 * cup keeps its gold identity regardless of the nav row's active state. */
export function SalamiCupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#f2a93b" {...props}>
      <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
    </svg>
  )
}

export function PredictionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M3.4 3.6h17.2v13.2H3.4ZM5.6 5.8v8.8h5.3V5.8Zm7.5 0v8.8h5.3V5.8ZM7.2 18.8h9.6v1.9H7.2Z"
      />
    </svg>
  )
}

export function KittyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M2.6 6.4h18.8v12.2H2.6Zm2.2 2.2v7.8h14.4V8.6Zm7.2 1a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8ZM5.6 3.2h12.8v2.1H5.6Z"
      />
    </svg>
  )
}

export function RulesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M12 2.2 3.4 5.5v6.4c0 5 3.6 8.3 8.6 10.1 5-1.8 8.6-5.1 8.6-10.1V5.5ZM10.8 16.4 6.8 12.3l1.9-1.9 2.1 2.1 4.4-4.4 1.9 1.9Z"
      />
    </svg>
  )
}

export function ArticlesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M4 2.8h12.4L20 6.4V21.2H4ZM7 8.2h10v2H7ZM7 12.2h10v2H7ZM7 16.2h6.4v2H7Z"
      />
    </svg>
  )
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4ZM4.2 20.8c1-3.9 4-6 7.8-6s6.8 2.1 7.8 6Z" />
    </svg>
  )
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 5.2h18v2.7H3ZM3 10.6h18v2.7H3ZM3 16h12v2.7H3Z" />
    </svg>
  )
}

/** No close/X icon exists in the design (the mobile hamburger is
 * decorative there, see project memory); drawn here in the same solid-
 * geometry style as the rest rather than a thin stroked X. */
export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="2.5" y="10.6" width="19" height="2.7" rx="0.4" transform="rotate(45 12 12)" />
      <rect x="2.5" y="10.6" width="19" height="2.7" rx="0.4" transform="rotate(-45 12 12)" />
    </svg>
  )
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.2a5.9 5.9 0 0 1 5.9 5.9c0 4.3 1.7 6.2 1.7 6.2H4.4s1.7-1.9 1.7-6.2A5.9 5.9 0 0 1 12 2.2ZM9.3 15.7h5.4a2.7 2.7 0 0 1-5.4 0Z" />
    </svg>
  )
}

/** The 4c "ringed ball" mark. The ring is split so it passes behind the ball at the top and in front at the bottom. */
export function BrandMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 100" fill="none" aria-hidden="true" {...props}>
      <ellipse cx="60" cy="50" rx="54" ry="19" stroke="#6d3ec9" strokeWidth="6" transform="rotate(-20 60 50)" />
      <circle cx="60" cy="50" r="31" fill="#a63fff" />
      <path d="M60 31 L74 41 L68 58 H52 L46 41 Z" fill="#0a0f1f" />
      <path d="M18 66 Q60 88 103 46" stroke="#eef0f9" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

export function HonoursIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M6.6 2.4h3.6L12 6.3l1.8-3.9h3.6l-2.9 6.2a6.4 6.4 0 1 1-5 0ZM12 11.3l1.1 2.3 2.5.3-1.8 1.8.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.8 2.5-.3Z"
      />
    </svg>
  )
}

export function GuideIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M1.8 4.4c3.6-.7 7 .1 9.2 1.8v15c-2.4-1.6-5.7-2.2-9.2-1.5ZM22.2 4.4c-3.6-.7-7 .1-9.2 1.8v15c2.4-1.6 5.7-2.2 9.2-1.5Z" />
    </svg>
  )
}

export function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 3h10v4.4h-2.2V5.2H5.2v13.6h5.6v-2.2H13V21H3ZM16.4 7.2 21.2 12l-4.8 4.8-1.6-1.6 2.1-2.1H9v-2.2h7.9l-2.1-2.1Z" />
    </svg>
  )
}
