import { cn } from 'cn'
import type { ReactNode } from 'react'

/** Vertical dated timeline, as used for past winners. */
export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={cn('relative ml-1.5 border-l-2 border-white/[0.08] pl-6', className)}>{children}</ol>
}

export function TimelineItem({
  color = '#a63fff',
  eyebrow,
  title,
  titleColor,
  children,
}: {
  color?: string
  eyebrow?: ReactNode
  title?: ReactNode
  titleColor?: string
  children?: ReactNode
}) {
  return (
    <li className="relative pb-6 last:pb-0">
      <span aria-hidden="true" className="absolute -left-[31px] top-1 size-3 rounded-full border-2 bg-astro-bg" style={{ borderColor: color }} />
      {eyebrow && <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{eyebrow}</div>}
      {title && (
        <div className="mb-2 mt-0.5 font-display text-[24px] leading-none text-astro-text" style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </div>
      )}
      {children}
    </li>
  )
}
