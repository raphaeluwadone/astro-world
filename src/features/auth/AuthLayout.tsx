import type { ReactNode } from 'react'
import { BrandMarkIcon } from '@/components/icons/nav-icons'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-astro-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-astro-accent to-astro-accent-strong"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)' }}
          >
            <BrandMarkIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-[0.08em] text-astro-text">{title}</h1>
            <p className="mt-1 text-sm text-astro-text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-astro-surface p-6">{children}</div>
      </div>
    </div>
  )
}
