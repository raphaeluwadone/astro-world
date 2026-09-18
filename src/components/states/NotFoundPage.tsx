import { Link } from '@tanstack/react-router'
import { OverTheBarIcon } from './icons'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <OverTheBarIcon />
      <div>
        <div className="font-display text-[34px] leading-none text-astro-text">
          That one&rsquo;s gone over the bar.
        </div>
        <p className="mx-auto mt-2.5 max-w-[40ch] text-sm text-astro-text-muted [text-wrap:pretty]">
          The page isn&rsquo;t here. Back to Home, or have another go.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-[11px] bg-astro-accent px-[22px] py-3 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5"
      >
        Back to Home
      </Link>
    </div>
  )
}
