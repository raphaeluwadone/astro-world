import { useBlocker } from '@tanstack/react-router'
import { useCallback } from 'react'
import { confirmAction } from '@/components/dialogs/confirm'

export interface UnsavedCopy {
  title?: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
}

const DEFAULT_COPY = {
  title: 'Leave without saving?',
  body: 'You have changes that haven’t been saved. If you leave now, they’re lost.',
  confirmLabel: 'Discard changes',
  cancelLabel: 'Keep editing',
}

const ask = (copy?: UnsavedCopy) => confirmAction({ ...DEFAULT_COPY, ...copy, tone: 'danger' })

/** Asks before leaving the page while there is unsaved work. Navigate with `ignoreBlocker: true` after a save. */
export function useUnsavedGuard(dirty: boolean, copy?: UnsavedCopy) {
  useBlocker({
    shouldBlockFn: async () => dirty && !(await ask(copy)),
    enableBeforeUnload: () => dirty,
  })
}

/** For dialogs and sheets: closes straight away, or asks first when there is unsaved work. */
export function useGuardedClose(dirty: boolean, close: () => void, copy?: UnsavedCopy) {
  return useCallback(() => {
    if (!dirty) return close()
    void ask(copy).then((ok) => ok && close())
  }, [dirty, close, copy])
}
