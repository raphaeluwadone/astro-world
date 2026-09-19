import type { ReactNode } from 'react'
import { JoinBackdrop } from '@/components/layout/JoinBackdrop'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'

export function AuthLayout({
  subtitle,
  children,
}: {
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-astro-bg px-4">
      <JoinBackdrop />
      <div className="relative z-[1] w-full max-w-sm" style={{ animation: 'jn-in 500ms cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-astro-accent to-astro-accent-strong"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)' }}
          >
            <BrandMarkIcon className="size-5" />
          </div>
          <div>
            <Wordmark size={24} className="justify-center text-astro-text" />
            <p className="mt-1 text-sm text-astro-text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-astro-surface p-6">{children}</div>
      </div>
    </div>
  )
}
