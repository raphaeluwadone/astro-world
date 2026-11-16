import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useState } from 'react'
import { isNoticeDismissed, rememberNotices } from '@/components/TimedNotice'

const TOUR_NOTICE_ID = 'tour-card'

/** A one-time nudge towards the short tour. It stays until it is opened or dismissed on this device. */
export function TourCard({ className }: { className?: string }) {
  const [hidden, setHidden] = useState(() => isNoticeDismissed(TOUR_NOTICE_ID))
  if (hidden) return null

  const dismiss = () => {
    rememberNotices([TOUR_NOTICE_ID])
    setHidden(true)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-[rgba(166,63,255,0.4)] bg-astro-surface px-4 py-3.5', className)}>
      <div className="min-w-0 flex-1 basis-[220px]">
        <div className="astro-eyebrow">New here?</div>
        <div className="mt-0.5 text-[14px] font-extrabold text-astro-text">Take the one-minute tour</div>
        <div className="text-[12.5px] text-astro-text-muted">How spots, teams and ratings work, in five short steps.</div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/onboarding"
          onClick={dismiss}
          className="astro-tap flex min-h-11 items-center rounded-[10px] bg-astro-accent px-4 text-[13.5px] font-extrabold text-astro-on-accent no-underline"
        >
          Show me
        </Link>
        <button type="button" onClick={dismiss} className="astro-tap min-h-11 px-2 text-[13px] font-bold text-astro-text-muted hover:text-astro-text">
          Not now
        </button>
      </div>
    </div>
  )
}
