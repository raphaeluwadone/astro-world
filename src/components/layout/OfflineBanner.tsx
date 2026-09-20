import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  return onlineManager.subscribe(callback)
}

function getSnapshot() {
  return onlineManager.isOnline()
}

/**
 * "Flat Ball," the offline half: queries use the default `networkMode:
 * 'online'`, so a fetch that starts while offline just sits paused
 * rather than erroring, and would otherwise leave a loader spinning
 * forever with no explanation. This is the one thing that tells the
 * user why. Anything already queued (a rating, a tribute) still sends
 * itself once the connection returns, that's React Query's default
 * behaviour, not something this banner does.
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true)

  if (isOnline) return null

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-[80] flex justify-center px-4 md:bottom-0 md:pb-4">
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(242,169,59,0.45)] bg-[#1b1608] px-5 py-3.5 shadow-lg">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#f2a93b" className="shrink-0">
          <path fillRule="evenodd" d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2Zm1 4.4v5.8l4 2.4-1 1.7-5-3V6.8Z" />
        </svg>
        <div>
          <div className="text-[13.5px] font-bold text-astro-text">No connection</div>
          <div className="text-xs text-astro-text-muted">
            We&rsquo;ll keep what you&rsquo;ve done and send it once you&rsquo;re back.
          </div>
        </div>
      </div>
    </div>
  )
}
