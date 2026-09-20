import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

const BORDER = {
  self: 'rgba(166,63,255,0.5)',
  community: 'rgba(56,189,248,0.5)',
} as const

/**
 * The member-app register from the design's modal spec: clipped
 * bottom-right corner like the player cards, a bit of spring on entry.
 * Claiming yourself is purple, nominating someone else is cyan
 * ("claim in purple, nominate in cyan" per the design status doc).
 */
export function MemberModal({
  open,
  onOpenChange,
  register = 'self',
  title,
  titleColor,
  body,
  children,
  maxWidth = 430,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  register?: 'self' | 'community'
  title: string
  titleColor?: string
  body?: ReactNode
  children?: ReactNode
  maxWidth?: number
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-[rgba(10,15,31,0.82)] backdrop-blur-[3px]"
          style={{ animation: 'md-backdrop 220ms ease both' }}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-astro-surface p-7 outline-none"
          style={{
            maxWidth,
            border: `1.5px solid ${BORDER[register]}`,
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)',
            animation: 'md-member 340ms cubic-bezier(.2,.9,.25,1) both',
          }}
        >
          <DialogPrimitive.Title
            className="mb-2.5 font-display text-[32px] leading-[0.98]"
            style={{ color: titleColor ?? '#eef0f9' }}
          >
            {title}
          </DialogPrimitive.Title>
          {body && (
            <DialogPrimitive.Description className="mb-5 text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              {body}
            </DialogPrimitive.Description>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
