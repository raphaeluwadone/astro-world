import { FlatBallIcon } from './icons'

/**
 * "Flat Ball": offline and server errors, the one state illustration
 * that isn't a loader or an empty result. Whatever the query, nothing
 * downstream should look right when this fires, so this replaces page
 * content rather than sitting inline with it.
 */
export function ErrorState({
  title = "That didn't load.",
  body = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string
  body?: string
  onRetry?: () => void
}) {
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
