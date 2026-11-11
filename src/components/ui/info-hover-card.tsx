import { cn } from 'cn'
import { HoverCard } from 'radix-ui'
import { useRef, useState, type ReactNode } from 'react'
import { useHoverCards } from '@/lib/hoverCards'

/**
 * Hover or focus shows the card after a short pause; a click goes to `onOpenFull`.
 * On touch the first tap shows the card instead, since there's no hover.
 */
export function InfoHoverCard({
  children,
  content,
  accent,
  label,
  onOpenFull,
  side = 'bottom',
  triggerClassName,
}: {
  children: ReactNode
  content: ReactNode
  accent: string
  label: string
  onOpenFull?: () => void
  side?: 'bottom' | 'right' | 'top'
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const pointer = useRef('mouse')
  const cards = useHoverCards()

  return (
    <HoverCard.Root open={cards && open} onOpenChange={setOpen} openDelay={400} closeDelay={80}>
      <HoverCard.Trigger asChild>
        <span
          tabIndex={0}
          role="link"
          aria-label={label}
          className={cn(triggerClassName ?? 'inline', 'cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-astro-accent/60')}
          onPointerDown={(e) => (pointer.current = e.pointerType)}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (cards && pointer.current === 'touch') setOpen((o) => !o)
            else onOpenFull?.()
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            e.stopPropagation()
            onOpenFull?.()
          }}
        >
          {children}
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side={side}
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-[280px] rounded-b-xl rounded-t-[4px] border border-white/[0.12] bg-[#16213f] px-3.5 pb-3 pt-3 text-left shadow-[0_20px_44px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in-0"
          style={{ borderTop: `3px solid ${accent}` }}
        >
          {content}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

export function HoverCardEyebrow({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color }}>
      {children}
    </div>
  )
}
