import { BellIcon, MenuIcon } from '@/components/icons/nav-icons'

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-astro-surface px-4.5 py-3.5 md:hidden">
      <button type="button" aria-label="Menu" className="text-astro-text-muted">
        <MenuIcon className="size-5" />
      </button>
      <div className="font-display text-[23px] leading-none tracking-[0.08em] text-astro-text">
        ASTRO
      </div>
      <button type="button" aria-label="Notifications" className="text-astro-text-muted">
        <BellIcon className="size-5" />
      </button>
    </header>
  )
}
