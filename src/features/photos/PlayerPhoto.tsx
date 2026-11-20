import { cn } from 'cn'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { usePlayerPhoto } from './hooks'

const PLACEHOLDER = 'linear-gradient(140deg, #243463, #182448)'

function Silhouette() {
  return (
    <svg viewBox="0 0 40 40" className="absolute inset-x-[18%] bottom-0 h-[78%] w-[64%] text-white/[0.07]" aria-hidden preserveAspectRatio="xMidYMax meet">
      <circle cx="20" cy="13" r="8" fill="currentColor" />
      <path d="M4 40c0-9 7-15 16-15s16 6 16 15Z" fill="currentColor" />
    </svg>
  )
}

/** Spreads the idle sheen out so a grid of placeholders doesn't sweep in unison. */
function sheenDelay(id: string | null | undefined) {
  let h = 0
  for (const ch of id ?? '') h = (h * 31 + ch.charCodeAt(0)) % 997
  return `${(h % 40) / 10}s`
}

function Sheen({ loading, delay }: { loading: boolean; delay: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.09) 50%,transparent 70%)',
        animation: loading ? 'astro-ph-load 1.2s ease-in-out infinite' : `astro-ph-idle 4.5s ease-in-out ${delay} infinite`,
      }}
    />
  )
}

/** A player's card photo cropped to fill its box, or an animated placeholder while it loads or when they haven't added one. */
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
  const [state, setState] = useState<{ url: string | null; status: 'loading' | 'loaded' | 'failed' }>({ url: null, status: 'loading' })
  const status = state.url === url ? state.status : 'loading'
  const delay = sheenDelay(playerId)

  if (!url || status === 'failed') {
    return (
      <div className={cn('relative shrink-0 overflow-hidden', className)} style={{ background: PLACEHOLDER, ...style }}>
        {fallback ?? <Silhouette />}
        <Sheen loading={false} delay={delay} />
      </div>
    )
  }
  return (
    <div className={cn('relative shrink-0 overflow-hidden bg-astro-surface-2', className)} style={status === 'loaded' ? style : { background: PLACEHOLDER, ...style }}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setState({ url, status: 'loaded' })}
        onError={() => setState({ url, status: 'failed' })}
        className={cn('size-full object-cover object-top transition-opacity duration-300', status === 'loaded' ? 'opacity-100' : 'opacity-0')}
      />
      {status === 'loading' && <Sheen loading delay="0s" />}
    </div>
  )
}
