import { Link } from '@tanstack/react-router'
import { BOTTOM_NAV_ITEMS } from './nav-items'

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 flex border-t border-border bg-astro-surface px-1.5 pb-3 pt-2.5 md:hidden">
      {BOTTOM_NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === '/' }}
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-astro-text-dim"
          activeProps={{ className: '!text-astro-accent' }}
        >
          <Icon className="size-5" />
          <span className="text-[9.5px] font-bold tracking-[0.03em]">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
