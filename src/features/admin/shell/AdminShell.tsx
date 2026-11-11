import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, type ReactNode } from 'react'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/api'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useNextMatchday } from '@/features/matchday/hooks'
import { ADMIN_NAV, type AdminNavItem } from './adminNav'
import { useAdminAttention, type AttentionItem, type AttentionTone } from './useAdminAttention'

const TONE: Record<AttentionTone, { bg: string; fg: string }> = {
  red: { bg: '#e0483f', fg: '#fff' },
  amber: { bg: '#f2a93b', fg: '#20150a' },
  cyan: { bg: '#38bdf8', fg: '#04121d' },
}

const MATCHDAY_STATUS: Record<string, string> = {
  open: 'Spots open',
  drawn: 'Teams drawn',
}

function NavIcon({ item }: { item: AdminNavItem }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden="true">
      <path d={item.icon} fillRule={item.iconEvenOdd ? 'evenodd' : undefined} />
    </svg>
  )
}

function Badge({ item }: { item: AttentionItem }) {
  const { bg, fg } = TONE[item.tone]
  return (
    <span
      className="ml-auto flex h-[18px] min-w-[19px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold"
      style={{ background: bg, color: fg }}
    >
      {item.badge}
    </span>
  )
}

function RailItem({ item, active, attention }: { item: AdminNavItem; active: boolean; attention?: AttentionItem }) {
  const base =
    'flex items-center gap-[11px] rounded-[9px] border-l-2 px-3 py-2.5 text-[12.5px] whitespace-nowrap no-underline'

  if (!item.to) {
    return (
      <div className={`${base} cursor-default border-transparent font-semibold text-astro-text-disabled`} aria-disabled="true">
        <NavIcon item={item} />
        <span>{item.label}</span>
        <span className="ml-auto text-[9.5px] font-bold uppercase tracking-[0.08em] text-astro-text-dim">Soon</span>
      </div>
    )
  }

  return (
    <Link
      to={item.to}
      data-active={active || undefined}
      className={
        active
          ? `${base} border-astro-cyan bg-[rgba(56,189,248,0.14)] font-extrabold text-astro-text`
          : `${base} border-transparent font-semibold text-astro-text-muted hover:bg-white/[0.04] hover:text-astro-text`
      }
    >
      <NavIcon item={item} />
      <span>{item.label}</span>
      {attention && <Badge item={attention} />}
    </Link>
  )
}

function NeedsYou({ items }: { items: AttentionItem[] }) {
  return (
    <div className="mt-auto rounded-[10px] border border-[rgba(255,255,255,0.09)] bg-[#101830] p-[13px]">
      <div className="mb-[7px] text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-[#4d5578]">Needs you</div>
      {items.length === 0 ? (
        <div className="text-xs text-astro-text-muted">Nothing waiting. Enjoy it.</div>
      ) : (
        <div className="flex flex-col gap-[7px]">
          {items.map((item) => (
            <div
              key={item.section}
              className={`flex items-center gap-2 text-xs ${item.tone === 'red' ? 'font-bold text-astro-text' : 'text-astro-text-muted'}`}
            >
              <span
                className="size-1.5 shrink-0 rounded-[2px]"
                style={{
                  background: TONE[item.tone].bg,
                  animation: item.tone === 'red' ? 'adm-pulse 1.6s ease-in-out infinite' : undefined,
                }}
              />
              {item.line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** The admin portal's own chrome: a separate app from the member shell, cyan not purple, no card motif. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const { data: matchday } = useNextMatchday()
  const attention = useAdminAttention()
  const attentionFor = (id: string) => attention.find((a) => a.section === id)
  const isActive = (item: AdminNavItem) => !!item.to && pathname.startsWith(item.to)
  const statusLabel = matchday ? MATCHDAY_STATUS[matchday.status] : undefined
  const strip = useRef<HTMLElement>(null)
  useEffect(() => {
    strip.current?.querySelector('[data-active]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-astro-admin-bg text-astro-text">
      <header className="sticky top-0 z-20 flex h-[62px] shrink-0 items-center gap-[22px] border-b border-[rgba(255,255,255,0.09)] bg-astro-admin-chrome px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <BrandMarkIcon className="h-8 w-auto shrink-0" />
          <Wordmark size={21} className="text-astro-text" />
          <span className="rounded-md border border-[rgba(56,189,248,0.45)] bg-astro-admin-raised px-2 py-[3px] text-[9.5px] font-extrabold tracking-[0.14em] text-astro-cyan">
            ADMIN
          </span>
        </div>

        <div className="hidden h-[26px] w-px shrink-0 bg-[rgba(255,255,255,0.09)] lg:block" />

        <div className="hidden min-w-0 flex-1 items-center gap-2.5 lg:flex">
          {matchday ? (
            <>
              <span className="whitespace-nowrap text-[12.5px] text-astro-text-dim">Matchday</span>
              <span className="whitespace-nowrap text-[13px] font-extrabold">
                {new Date(matchday.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {statusLabel && (
                <span className="whitespace-nowrap rounded-full border border-[rgba(242,169,59,0.45)] bg-astro-admin-raised px-3 py-[5px] text-[11.5px] font-extrabold text-astro-amber">
                  {statusLabel}
                </span>
              )}
            </>
          ) : (
            <span className="whitespace-nowrap text-[12.5px] text-astro-text-dim">No matchday scheduled</span>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-[7px] rounded-[9px] border border-[rgba(255,255,255,0.09)] bg-astro-admin-raised px-3.5 py-[9px] text-[12.5px] font-bold text-astro-text-muted no-underline hover:text-astro-text"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
            </svg>
            <span className="hidden sm:inline">Back to the app</span>
          </Link>
          {player && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Account menu" className="flex items-center gap-[9px] rounded-[9px] px-1.5 py-1 text-left hover:bg-white/[0.05]">
                  <span className="flex size-[30px] items-center justify-center rounded-lg bg-[linear-gradient(140deg,#243463,#182448)] font-display text-[12px] text-astro-cyan">
                    {player.nickname.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden leading-[1.2] md:block">
                    <span className="block text-[12.5px] font-extrabold">{player.nickname}</span>
                    <span className="block text-[10.5px] text-astro-text-dim">Admin</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{player.full_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="font-bold text-astro-accent-soft">
                    Switch to the app
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut()
                    await navigate({ to: '/login' })
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav className="hidden w-[212px] shrink-0 flex-col gap-[3px] border-r border-[rgba(255,255,255,0.09)] bg-astro-admin-chrome px-3 py-[18px] md:sticky md:top-[62px] md:flex md:h-[calc(100vh-62px)] md:overflow-y-auto">
          {ADMIN_NAV.map((group, i) => (
            <div key={group.label} className="flex flex-col gap-[3px]">
              <div
                className={`px-2.5 pb-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#4d5578] ${i === 0 ? 'pt-1.5' : 'pt-4'}`}
              >
                {group.label}
              </div>
              {group.items.map((item) => (
                <RailItem key={item.id} item={item} active={isActive(item)} attention={attentionFor(item.id)} />
              ))}
            </div>
          ))}
          <div className="mt-4 flex flex-1 flex-col">
            <NeedsYou items={attention} />
          </div>
        </nav>

        <nav ref={strip} className="flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.09)] bg-astro-admin-chrome px-3 py-2 [scrollbar-width:none] md:hidden">
          {ADMIN_NAV.flatMap((g) => g.items)
            .filter((item) => item.to)
            .map((item) => (
              <RailItem key={item.id} item={item} active={isActive(item)} attention={attentionFor(item.id)} />
            ))}
        </nav>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 md:px-[30px] md:pt-[26px]">{children}</main>
      </div>
    </div>
  )
}
