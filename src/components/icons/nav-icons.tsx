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

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.2a5.9 5.9 0 0 1 5.9 5.9c0 4.3 1.7 6.2 1.7 6.2H4.4s1.7-1.9 1.7-6.2A5.9 5.9 0 0 1 12 2.2ZM9.3 15.7h5.4a2.7 2.7 0 0 1-5.4 0Z" />
    </svg>
  )
}

/** The adopted "1a" mark from the AllStars rebrand (rev 42): a
 * constructed 10-point star, 46/16 outer-to-inner ratio, never redrawn
 * by eye. Replaces the earlier diamond mark used under the Astro name. */
export function BrandMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="#0a0f1f" {...props}>
      <path d="M50.00 4.00L59.40 37.06L93.75 35.79L65.22 54.94L77.04 87.21L50.00 66.00L22.96 87.21L34.78 54.94L6.25 35.79L40.60 37.06Z" />
    </svg>
  )
}
