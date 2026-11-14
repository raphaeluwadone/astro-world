import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { MemberModal } from './MemberModal'

export interface ConfirmOptions {
  title: string
  body?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** 'danger' for removals and pull-outs, 'admin' for the admin portal's cyan register. */
  tone?: 'default' | 'danger' | 'admin'
  eyebrow?: string
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

let current: Pending | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Asks before an action goes through. Resolves true only if the player confirms. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => {
    current = { ...options, resolve }
    emit()
  })
}

/** Runs the action once confirmed. */
export async function withConfirm(options: ConfirmOptions, action: () => void) {
  if (await confirmAction(options)) action()
}

/** A short toast with an Undo button, for actions that can be taken back. */
export function undoToast(message: string, undo: () => void) {
  toast(message, { duration: 8000, action: { label: 'Undo', onClick: undo } })
}

function settle(ok: boolean) {
  const p = current
  current = null
  emit()
  p?.resolve(ok)
}

/** Mounted once, renders whichever confirmation is open. */
export function ConfirmHost() {
  const pending = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
  // Keep the last options while the dialog animates closed.
  const [shown, setShown] = useState<Pending | null>(null)
  if (pending && pending !== shown) setShown(pending)
  const o = pending ?? shown
  if (!o) return null
  const open = !!pending
  const onOpenChange = (next: boolean) => !next && settle(false)

  if (o.tone === 'admin') {
    return (
      <AdminConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        eyebrow={o.eyebrow ?? 'Confirm'}
        title={o.title}
        body={o.body}
        cancelLabel={o.cancelLabel}
        confirmLabel={o.confirmLabel}
        onConfirm={() => settle(true)}
      />
    )
  }

  return (
    <MemberModal open={open} onOpenChange={onOpenChange} title={o.title} body={o.body}>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          autoFocus={o.tone !== 'danger'}
          onClick={() => settle(true)}
          className={
            o.tone === 'danger'
              ? 'rounded-[11px] bg-astro-red px-5 py-3 text-[13px] font-extrabold text-white'
              : 'rounded-[11px] bg-astro-accent px-5 py-3 text-[13px] font-extrabold text-astro-on-accent'
          }
        >
          {o.confirmLabel}
        </button>
        <button
          type="button"
          autoFocus={o.tone === 'danger'}
          onClick={() => settle(false)}
          className="rounded-[11px] border border-white/[0.09] bg-astro-surface-2 px-5 py-3 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
        >
          {o.cancelLabel ?? 'Cancel'}
        </button>
      </div>
    </MemberModal>
  )
}
