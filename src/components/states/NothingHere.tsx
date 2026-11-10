import { cn } from 'cn'
import type { ReactNode } from 'react'
import { EmptyPitchIcon } from './icons'

/**
 * The go-to empty state for lists, tables and searches with nothing in them.
 * `compact` fits inside a card or table; the default suits a whole page section.
 */
export function NothingHere({
  title = 'Empty pitch',
  body = 'Nothing here yet.',
  compact,
  action,
  className,
}: {
  title?: string
  body?: ReactNode
  compact?: boolean
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-2 rounded-xl border border-dashed border-white/[0.08] px-4 py-5' : 'gap-4 px-6 py-12',
        className,
      )}
    >
      <div className={compact ? 'origin-center scale-[0.55] -my-6' : undefined}>
        <EmptyPitchIcon />
      </div>
      <div>
        <div className={cn('font-bold text-astro-text', compact ? 'text-[13.5px]' : 'mb-1.5 text-[15px]')}>{title}</div>
        <p className={cn('mx-auto max-w-[36ch] text-astro-text-muted [text-wrap:pretty]', compact ? 'text-[12px]' : 'text-[13px] leading-[1.55]')}>
          {body}
        </p>
      </div>
      {action}
    </div>
  )
}
