import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

/**
 * The admin register from the design's modal spec: cyan, near-square
 * corners, no spring, fades in over four frames and gets on with it.
 * Destructive confirms say what happens, not "are you sure?"
 */
export function AdminConfirmDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  body,
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eyebrow: string
  title: string
  body: ReactNode
  cancelLabel?: string
  confirmLabel: string
  onConfirm: () => void
  isPending?: boolean
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-[rgba(4,8,18,0.88)]"
          style={{ animation: 'md-backdrop 140ms ease both' }}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-48px)] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[5px] border border-[rgba(56,189,248,0.5)] bg-[#0f1730] p-[26px] outline-none"
          style={{ animation: 'md-admin 140ms ease both' }}
        >
          <div className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-astro-cyan">
            {eyebrow}
          </div>
          <DialogPrimitive.Title className="mb-3 font-display text-[29px] leading-none text-astro-text">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-4 text-[13.5px] leading-[1.6] text-astro-text [text-wrap:pretty]">
            {body}
          </DialogPrimitive.Description>
          <div className="flex flex-wrap items-center gap-[9px]">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="px-2 py-3 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
              >
                {cancelLabel}
              </button>
            </DialogPrimitive.Close>
            <button
              type="button"
              disabled={isPending}
              onClick={onConfirm}
              className="ml-auto rounded-lg bg-astro-cyan px-5 py-3 text-[13.5px] font-extrabold text-[#04121d] disabled:opacity-60"
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
