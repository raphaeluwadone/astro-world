import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

/**
 * Ade's page never raises its voice: no purple, no cyan, no icons,
 * nothing uppercase, serif for the words, a slow fade. Only two modals
 * live here (write a tribute, take one down) and there are no toasts
 * on this page at all, see the `silent` mutation meta in the memorial
 * feature's hooks.
 */
export function MemorialModal({
  open,
  onOpenChange,
  title,
  body,
  children,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  confirmVariant = 'primary',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body?: ReactNode
  children?: ReactNode
  cancelLabel: string
  confirmLabel: ReactNode
  onConfirm: () => void
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'outline'
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-[rgba(8,12,24,0.94)]"
          style={{ animation: 'md-backdrop 460ms ease both' }}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-48px)] max-w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(203,213,245,0.28)] bg-[#0e1424] p-8 outline-none"
          style={{ animation: 'md-quiet 520ms ease both' }}
        >
          <DialogPrimitive.Title className="mb-3 font-serif text-[28px] leading-[1.15] text-[#e8ecfa]">
            {title}
          </DialogPrimitive.Title>
          {body && (
            <DialogPrimitive.Description className="mb-5.5 text-[13.5px] leading-[1.65] text-astro-text-muted [text-wrap:pretty]">
              {body}
            </DialogPrimitive.Description>
          )}
          {children}
          <div className="mt-5.5 flex flex-wrap items-center gap-2.5">
            <DialogPrimitive.Close asChild>
              <button type="button" className="px-2 py-3 text-[13.5px] font-semibold text-astro-text-muted hover:text-[#e8ecfa]">
                {cancelLabel}
              </button>
            </DialogPrimitive.Close>
            <button
              type="button"
              disabled={confirmDisabled}
              onClick={onConfirm}
              className={
                confirmVariant === 'primary'
                  ? 'ml-auto rounded-xl bg-[#cbd5f5] px-[22px] py-3 text-sm font-bold text-[#0e1424] disabled:opacity-50'
                  : 'ml-auto rounded-xl border border-[rgba(203,213,245,0.4)] bg-[#151c30] px-[22px] py-3 text-sm font-bold text-[#e8ecfa] disabled:opacity-50'
              }
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
