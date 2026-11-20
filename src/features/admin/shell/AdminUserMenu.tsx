import { Link, useNavigate } from '@tanstack/react-router'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { BellIcon, GuideIcon, ProfileIcon, SignOutIcon } from '@/components/icons/nav-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/api'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useUnreadCount } from '@/features/notifications/hooks'

const ITEM =
  'gap-3 rounded-[9px] px-2.5 py-2 text-[13px] font-bold text-astro-text-muted focus:bg-astro-admin-raised focus:text-astro-text'

/** Admin counterpart of the member UserMenu, in the portal's cyan and navy. */
export function AdminUserMenu() {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const unread = useUnreadCount()

  if (!player) return null

  const initials = player.nickname.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="group flex items-center gap-[9px] rounded-[9px] border border-transparent py-1 pl-1.5 pr-2 text-left transition-colors hover:bg-white/[0.05] data-[state=open]:border-[rgba(56,189,248,0.35)] data-[state=open]:bg-astro-admin-raised"
        >
          <Avatar photo={player.photo_url} initials={initials} className="size-[30px] text-[12px]" />
          <span className="hidden leading-[1.2] md:block">
            <span className="block text-[12.5px] font-extrabold">{player.nickname}</span>
            <span className="block text-[10.5px] text-astro-text-dim">Admin</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="size-3.5 text-astro-text-dim transition-transform group-data-[state=open]:rotate-180"
          >
            <path d="m12 15.6-6-6 1.6-1.6 4.4 4.4 4.4-4.4L18 9.6Z" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-[12px] border border-[rgba(255,255,255,0.09)] bg-astro-admin-card p-1.5 text-astro-text shadow-[0_18px_40px_rgba(0,0,0,0.5)] ring-0"
      >
        <div
          className="mb-1 rounded-[9px] border border-[rgba(56,189,248,0.2)] px-3 py-3"
          style={{ background: 'linear-gradient(110deg, #16305a 0%, #0b101f 80%)' }}
        >
          <div className="flex items-center gap-3">
            <Avatar photo={player.photo_url} initials={initials} className="size-10 text-sm" />
            <div className="min-w-0">
              <div className="truncate font-display text-[20px] leading-none text-astro-text">{player.nickname.toUpperCase()}</div>
              <div className="mt-1 truncate text-[11.5px] text-astro-text-muted">{player.full_name}</div>
            </div>
            <span className="ml-auto shrink-0 self-start rounded-md border border-[rgba(56,189,248,0.45)] bg-astro-admin-raised px-1.5 py-[2px] text-[9px] font-extrabold tracking-[0.14em] text-astro-cyan">
              ADMIN
            </span>
          </div>
        </div>

        <MenuLink to="/profile" icon={ProfileIcon}>
          Profile
        </MenuLink>
        <MenuLink to="/notifications" icon={BellIcon}>
          Notifications
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-astro-cyan px-1.5 text-[10.5px] font-extrabold leading-[17px] text-[#04121d]">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </MenuLink>
        <MenuLink to="/guide" icon={GuideIcon}>
          How Astro works
        </MenuLink>

        <DropdownMenuItem
          asChild
          className={`${ITEM} mt-1 border border-astro-accent/35 bg-astro-surface-2 text-astro-accent-soft focus:bg-astro-accent/15 focus:text-astro-accent-soft`}
        >
          <Link to="/">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
              <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
            </svg>
            Switch to the app
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1.5 bg-[rgba(255,255,255,0.09)]" />
        <DropdownMenuItem onClick={handleSignOut} className={`${ITEM} focus:bg-astro-red/10 focus:text-astro-red`}>
          <SignOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MenuLink({ to, icon: Icon, children }: { to: string; icon: ComponentType<SVGProps<SVGSVGElement>>; children: ReactNode }) {
  return (
    <DropdownMenuItem asChild className={ITEM}>
      <Link to={to}>
        <Icon className="size-4 text-astro-text-dim" />
        {children}
      </Link>
    </DropdownMenuItem>
  )
}

function Avatar({ photo, initials, className }: { photo?: string | null; initials: string; className: string }) {
  if (photo) return <img src={photo} alt="" className={`${className} shrink-0 rounded-lg border border-astro-cyan/40 object-cover`} />
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-astro-cyan/30 bg-[linear-gradient(140deg,#243463,#182448)] font-display text-astro-cyan`}
    >
      {initials}
    </span>
  )
}
