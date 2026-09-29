import { Link } from '@tanstack/react-router'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { monthOf } from '@/features/matchday/api'
import { useMonthlyMembers, useNextMatchday, useWeeklyClaims } from '@/features/matchday/hooks'
import { SIDEBAR_NAV_ITEMS } from './nav-items'

/**
 * The nav list, admin link, memorial link and next-matchday widget:
 * identical content in the desktop sidebar and the mobile drawer, only
 * the surrounding chrome (a fixed aside vs. a Dialog panel) differs.
 * onNavigate fires on every real link click; a no-op on desktop, closes
 * the drawer on mobile.
 */
export function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { player } = useCurrentPlayer()
  const { data: matchday } = useNextMatchday()
  const { data: weeklyClaims = [] } = useWeeklyClaims(matchday?.id)
  const { data: monthlyMembers = [] } = useMonthlyMembers(matchday ? monthOf(matchday.played_at) : undefined)

  const daysUntil = matchday
    ? Math.round((new Date(matchday.played_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  // Confirmed spots, not free availability responses: getting one of the
  // 30 is a real weekly or monthly claim now, never a free "I'm in".
  const inCount = weeklyClaims.length + monthlyMembers.length

  return (
    <>
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
        {SIDEBAR_NAV_ITEMS.map(({ label, to, icon: Icon, disabled }) => {
          const badge =
            label === 'Matchday' && daysUntil !== null && daysUntil >= 0 ? (
              <span className="astro-marker">{daysUntil === 0 ? 'Today' : daysUntil}</span>
            ) : null

          if (disabled) {
            return (
              <div key={to} className="astro-nav__item cursor-default opacity-40">
                <Icon className="size-[19px] shrink-0" />
                <span>{label}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.08em] text-astro-text-dim">
                  Soon
                </span>
              </div>
            )
          }

          return (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="astro-nav__item no-underline"
              activeProps={{ className: 'astro-nav__item--active' }}
              onClick={onNavigate}
            >
              <Icon className="size-[19px] shrink-0" />
              <span>{label}</span>
              {badge}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-[22px]">
        {player?.is_admin && (
          <Link
            to="/admin"
            onClick={onNavigate}
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
              <div className="text-[10px] text-astro-text-dim">Claims &amp; matchday are live</div>
            </div>
          </Link>
        )}

        <Link
          to="/memorial"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-[11px] px-2 py-2.5 no-underline hover:bg-[rgba(166,63,255,0.07)]"
        >
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-[rgba(166,63,255,0.4)] bg-astro-surface-2 font-display text-[15px] text-astro-accent-soft"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 74% 100%, 0 100%)' }}
          >
            13
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
              In memory
            </div>
            <div className="text-[12.5px] font-extrabold text-astro-text-muted">Salami</div>
          </div>
        </Link>

        {matchday && (
          <div className="rounded-[14px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 p-3.5">
            <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">
              Next matchday
            </div>
            <div className="font-display text-[28px] leading-none text-astro-accent">
              {new Date(matchday.played_at)
                .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                .toUpperCase()}
            </div>
            <div className="mt-1.5 text-xs text-astro-text-muted">
              {inCount} of {matchday.capacity} already in
            </div>
          </div>
        )}
      </div>
    </>
  )
}
