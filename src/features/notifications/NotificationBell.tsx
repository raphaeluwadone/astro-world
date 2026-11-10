import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useState } from 'react'
import { BellIcon } from '@/components/icons/nav-icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useMarkRead, useNotifications, useUnreadCount } from './hooks'
import { NotificationItem } from './NotificationItem'

export function UnreadDot({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-astro-accent px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-astro-bg',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

/** Desktop bell with the latest notifications in a dropdown. */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data = [] } = useNotifications()
  const unread = useUnreadCount()
  const markRead = useMarkRead()
  const latest = data.slice(0, 8)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative flex size-10 items-center justify-center rounded-full border border-border bg-astro-surface text-astro-text-muted transition-colors hover:border-astro-accent/40 hover:text-astro-text"
        >
          <BellIcon className="size-[18px]" />
          <UnreadDot count={unread} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[360px] border border-white/[0.08] bg-astro-surface p-0 text-astro-text">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="font-display text-[22px] leading-none">Notifications</span>
          {unread > 0 && (
            <button type="button" onClick={() => markRead.mutate(null)} className="text-xs font-bold text-astro-accent hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {latest.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-astro-text-dim">Nothing yet. Badges, matchday news and mentions land here.</p>
          ) : (
            latest.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                compact
                onOpen={(item) => {
                  if (!item.read_at) markRead.mutate([item.id])
                  setOpen(false)
                }}
              />
            ))
          )}
        </div>
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-white/[0.06] px-4 py-2.5 text-center text-[13px] font-bold text-astro-text-muted no-underline hover:bg-white/[0.04] hover:text-astro-text"
        >
          See all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
