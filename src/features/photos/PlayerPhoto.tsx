import { cn } from 'cn'
import type { CSSProperties, ReactNode } from 'react'
import { usePlayerPhoto } from './hooks'

const PLACEHOLDER = 'linear-gradient(140deg, #243463, #182448)'

/** A player's card photo cropped to fill its box, or the usual placeholder when they haven't added one. */
export function PlayerPhoto({
  playerId,
  alt,
  className,
  style,
  fallback,
}: {
  playerId: string | null | undefined
  alt: string
  className?: string
  style?: CSSProperties
  fallback?: ReactNode
}) {
  const url = usePlayerPhoto(playerId)
  if (!url) {
    return (
      <div className={cn('shrink-0 overflow-hidden', className)} style={{ background: PLACEHOLDER, ...style }}>
        {fallback}
      </div>
    )
  }
  return (
    <div className={cn('shrink-0 overflow-hidden bg-astro-surface-2', className)} style={style}>
      <img src={url} alt={alt} loading="lazy" className="size-full object-cover object-top" />
    </div>
  )
}
