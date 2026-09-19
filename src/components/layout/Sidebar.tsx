import { Link } from '@tanstack/react-router'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { SIDEBAR_NAV_ITEMS } from './nav-items'

export function Sidebar() {
  const { player } = useCurrentPlayer()

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-border bg-astro-surface px-4 pt-[26px] pb-[30px] md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-astro-accent to-astro-accent-strong"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)' }}
        >
          <BrandMarkIcon className="size-[18px]" />
        </div>
        <Wordmark size={27} className="leading-none text-astro-text" />
      </div>

      <nav className="flex flex-col gap-[3px]">
        {SIDEBAR_NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === '/' }}
            className="astro-nav__item no-underline"
            activeProps={{ className: 'astro-nav__item--active' }}
          >
            <Icon className="size-[19px] shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-[22px]">
        {player?.is_admin && (
          <Link
            to="/admin"
            className="flex items-center gap-2.5 rounded-[11px] border border-[rgba(56,189,248,0.45)] bg-astro-admin-raised px-3.5 py-3 no-underline hover:bg-astro-cyan/15"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#38bdf8" className="shrink-0">
              <path
                fillRule="evenodd"
                d="M12 2.2 3.4 5.5v6.4c0 5 3.6 8.3 8.6 10.1 5-1.8 8.6-5.1 8.6-10.1V5.5Zm0 5.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm-4 9.4c.5-1.9 2-2.9 4-2.9s3.5 1 4 2.9Z"
              />
            </svg>
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-astro-cyan">Admin portal</div>
              <div className="text-[10px] text-astro-text-dim">Not built yet</div>
            </div>
          </Link>
        )}

        {/* TODO: ballot-status copy ("Ballot night / Wed 20:00") needs revisiting:
            the draw is admin-triggered near/on matchday, not a fixed Wed 20:00 cutoff.
            Left as design-accurate placeholder until the ballot feature is built. */}
        <div className="rounded-[14px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 p-3.5">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">
            Ballot night
          </div>
          <div className="font-display text-[28px] leading-none text-astro-accent">WED 20:00</div>
          <div className="mt-1.5 text-xs text-astro-text-muted">18 of 30 already in</div>
        </div>
      </div>
    </aside>
  )
}
