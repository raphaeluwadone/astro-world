import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { reportError } from '@/lib/monitoring'
import { FlatBallIcon } from './icons'

const RELOADED_KEY = 'astro:reloaded-for-deploy'

// After a new deploy, an open tab still asks for the old page files, which are gone.
const isStaleBuild = (e: unknown) =>
  e instanceof Error && /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(e.message)

function reloadOnce() {
  try {
    // A reload moments ago didn't fix it, so don't loop.
    if (Date.now() - Number(sessionStorage.getItem(RELOADED_KEY) ?? 0) < 10_000) return false
    sessionStorage.setItem(RELOADED_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Shown when a page crashes or fails to load. */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const stale = isStaleBuild(error)

  useEffect(() => {
    if (stale && reloadOnce()) return
    reportError(error, { boundary: 'route', path: window.location.pathname })
  }, [error, stale])

  const retry = () => {
    reset()
    router.invalidate()
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <FlatBallIcon />
      <div>
        <div className="font-display text-[34px] leading-none text-astro-text">
          {stale ? 'Astro has been updated.' : 'That one didn’t come off.'}
        </div>
        <p className="mx-auto mt-2.5 max-w-[40ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          {stale ? 'Reload to get the latest version.' : 'Something broke on this page. We’ve been told about it. Have another go, or head back to Home.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={stale ? () => window.location.reload() : retry}
          className="rounded-[11px] bg-astro-accent px-[22px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
        >
          {stale ? 'Reload' : 'Try again'}
        </button>
        <Link to="/" reloadDocument className="rounded-[11px] border border-white/[0.14] px-[22px] py-3 text-sm font-extrabold text-astro-text">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
