import { Link, useNavigate } from '@tanstack/react-router'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { BellIcon, GuideIcon, ProfileIcon, SignOutIcon } from '@/components/icons/nav-icons'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/api'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { useUnreadCount } from '@/features/notifications/hooks'
import { setHoverCards, useHoverCards } from '@/lib/hoverCards'

const ITEM = 'gap-3 rounded-[9px] px-2.5 py-2 text-[13px] font-bold text-astro-text-muted focus:bg-astro-surface-2 focus:text-astro-text'

export function UserMenu() {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const hoverCards = useHoverCards()

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/login' })
  }

  const initials = (player?.nickname ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="fixed right-6 top-5 z-20 hidden items-center gap-2 md:flex">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex items-center gap-2.5 rounded-full border border-border bg-astro-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-astro-accent/40 data-[state=open]:border-astro-accent/60"
          >
            <Avatar photo={player?.photo_url} initials={initials} className="size-7 text-xs" />
            <span className="text-sm font-bold text-astro-text">{player?.nickname ?? 'Loading…'}</span>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5 text-astro-text-dim transition-transform group-data-[state=open]:rotate-180">
              <path d="m12 15.6-6-6 1.6-1.6 4.4 4.4 4.4-4.4L18 9.6Z" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-[14px] border border-border bg-astro-surface p-1.5 text-astro-text shadow-[0_18px_40px_rgba(0,0,0,0.45)] ring-0">
          <div className="relative mb-1 overflow-hidden rounded-[10px] px-3 py-3" style={{ background: 'linear-gradient(110deg, #2a1147 0%, #111a33 75%)' }}>
            <div className="flex items-center gap-3">
              <Avatar photo={player?.photo_url} initials={initials} className="size-10 text-sm" />
              <div className="min-w-0">
                <div className="truncate font-display text-[20px] leading-none text-astro-text">{player?.nickname?.toUpperCase()}</div>
                <div className="mt-1 truncate text-[11.5px] text-astro-text-muted">{player?.full_name}</div>
              </div>
            </div>
          </div>

          <MenuLink to="/profile" icon={ProfileIcon}>
            Profile
          </MenuLink>
          <MenuLink to="/notifications" icon={BellIcon}>
            Notifications
            {unread > 0 && (
              <span className="ml-auto rounded-full bg-astro-accent px-1.5 text-[10.5px] font-extrabold leading-[17px] text-white">{unread > 9 ? '9+' : unread}</span>
            )}
          </MenuLink>
          <MenuLink to="/guide" icon={GuideIcon}>
            How Astro works
          </MenuLink>

          <DropdownMenuSeparator className="mx-1 my-1.5 bg-border" />
          <DropdownMenuCheckboxItem
            checked={hoverCards}
            onCheckedChange={setHoverCards}
            onSelect={(e) => e.preventDefault()}
            className="gap-3 rounded-[9px] py-2 pl-2.5 text-[13px] font-bold text-astro-text-muted focus:bg-astro-surface-2 focus:text-astro-text"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4 text-astro-text-dim">
              <path fillRule="evenodd" d="M2.6 4h18.8v12.4H2.6Zm2.2 2.2v8h14.4v-8ZM7 8.4h6v2H7Zm0 3h9.8v1.4H7ZM10 18.4h12.4V20H10Z" />
            </svg>
            Hover cards
          </DropdownMenuCheckboxItem>

          {player?.is_admin && (
            <DropdownMenuItem asChild className={`${ITEM} mt-1 border border-[rgba(56,189,248,0.35)] bg-astro-admin-raised text-astro-cyan focus:bg-astro-cyan/15 focus:text-astro-cyan`}>
              <Link to="/admin">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
                  <path fillRule="evenodd" d="M12 2.2 3.4 5.5v6.4c0 5 3.6 8.3 8.6 10.1 5-1.8 8.6-5.1 8.6-10.1V5.5Zm0 5.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm-4 9.4c.5-1.9 2-2.9 4-2.9s3.5 1 4 2.9Z" />
                </svg>
                Switch to admin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="mx-1 my-1.5 bg-border" />
          <DropdownMenuItem onClick={handleSignOut} className={`${ITEM} focus:bg-astro-red/10 focus:text-astro-red`}>
            <SignOutIcon className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function MenuLink({ to, icon: Icon, children }: { to: string; icon: ComponentType<SVGProps<SVGSVGElement>>; children: ReactNode }) {
  return (
    <DropdownMenuItem asChild className={ITEM}>
      <Link to={to} activeProps={{ className: 'text-astro-text' }}>
        <Icon className="size-4 text-astro-text-dim" />
        {children}
      </Link>
    </DropdownMenuItem>
  )
}

function Avatar({ photo, initials, className }: { photo?: string | null; initials: string; className: string }) {
  if (photo) return <img src={photo} alt="" className={`${className} shrink-0 rounded-full border border-astro-accent/40 object-cover`} />
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full border border-astro-accent/40 bg-astro-surface-2 font-display text-astro-accent`}>
      {initials}
    </div>
  )
}
