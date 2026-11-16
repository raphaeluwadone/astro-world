import { useState, useSyncExternalStore } from 'react'

const KEY = 'astro:hover-cards'
const listeners = new Set<() => void>()

function read() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setHoverCards(on: boolean) {
  try {
    if (on) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch {
    // Storage blocked: the setting just won't stick.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => e.key === KEY && listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Whether info cards show on hover. On by default; saved per device. */
export function useHoverCards() {
  return useSyncExternalStore(subscribe, read, () => true)
}

/**
 * Open state for one hover card. While cards are off, hovers are ignored rather than queued:
 * Radix never reports a close for a card it thinks is already closed, so they would all open at once.
 */
export function useHoverCardOpen() {
  const cards = useHoverCards()
  const [open, setOpen] = useState(false)
  return {
    cards,
    open: cards && open,
    onOpenChange: (o: boolean) => setOpen(cards && o),
    toggle: () => setOpen((o) => cards && !o),
  }
}
