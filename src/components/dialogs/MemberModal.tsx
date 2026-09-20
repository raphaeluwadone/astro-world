import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

/**
 * The member-app register from the design's modal spec: purple, clipped
 * bottom-right corner like the player cards, a bit of spring on entry.
 * Copy can be dry-funny here since nothing on this register is serious.
 */
export function MemberModal({
  open,
  onOpenChange,
  title,
  body,
  children,
  maxWidth = 430,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
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
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border-[1.5px] border-[rgba(166,63,255,0.5)] bg-astro-surface p-7 outline-none"
          style={{
            maxWidth,
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)',
            animation: 'md-member 340ms cubic-bezier(.2,.9,.25,1) both',
          }}
        >
          <DialogPrimitive.Title className="mb-2.5 font-display text-[32px] leading-[0.98] text-astro-text">
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
