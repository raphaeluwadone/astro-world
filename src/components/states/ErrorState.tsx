import { onlineManager } from '@tanstack/react-query'
import { FlatBallIcon } from './icons'

/** Offline and server errors. Replaces page content rather than sitting inline with it. */
export function ErrorState({
  title,
  body,
  onRetry,
}: {
  title?: string
  body?: string
  onRetry?: () => void
}) {
  const offline = !onlineManager.isOnline()
  title ??= offline ? 'Flat ball. No connection.' : 'That one didn’t come off.'
  body ??= offline
    ? 'The match is on hold until you’re back online. We’ll pick it up from where you left off.'
    : 'Something went wrong on our end. Have another go.'
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <FlatBallIcon />
      <div>
        <div className="mb-1.5 text-[15px] font-bold text-astro-text">{title}</div>
        <p className="mx-auto max-w-[36ch] text-[13px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
          {body}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[11px] bg-astro-accent px-5 py-2.5 text-[13px] font-extrabold text-astro-on-accent"
        >
          Try again
        </button>
      )}
    </div>
  )
}
