import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  return onlineManager.subscribe(callback)
}

function getSnapshot() {
  return onlineManager.isOnline()
}

/**
 * Queries pause while offline instead of failing, which would otherwise leave loaders spinning with no
 * explanation. Anything queued sends itself once the connection returns (React Query's default).
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true)

  if (isOnline) return null

  return (
    <div role="status" className="fixed inset-x-0 bottom-[76px] z-[80] flex justify-center px-4 md:bottom-0 md:pb-4">
      <div className="flex items-center gap-3.5 rounded-2xl border border-[rgba(242,169,59,0.45)] bg-[#1b1608] py-3 pl-3.5 pr-5 shadow-lg">
        <svg width="40" height="28" viewBox="96 82 64 34" aria-hidden="true" className="shrink-0">
          <ellipse cx="128" cy="112" rx="30" ry="4" fill="#000" fillOpacity="0.34" />
          <path d="M100 112c0-13 12.5-22 28-22s28 9 28 22z" fill="#eef0f9" />
          <path d="M100 112h56" stroke="#9aa3c4" strokeWidth="2" />
          <circle cx="128" cy="100" r="5.4" fill="#0a0f1f" />
          <path d="M113 106l5-3M143 106l-5-3" stroke="#0a0f1f" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M150 88c0 0 5-4 2-8" stroke="#e0483f" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <div>
          <div className="text-[13.5px] font-bold text-astro-text">Flat ball. You&rsquo;re offline.</div>
          <div className="text-xs text-astro-text-muted">
            Play&rsquo;s paused. Anything you do waits on the touchline and comes on when you&rsquo;re back.
          </div>
        </div>
      </div>
    </div>
  )
}
