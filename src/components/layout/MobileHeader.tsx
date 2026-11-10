import { BellIcon, MenuIcon } from '@/components/icons/nav-icons'
import { Link } from '@tanstack/react-router'
import { Wordmark } from '@/components/icons/Wordmark'
import { UnreadDot } from '@/features/notifications/NotificationBell'
import { useUnreadCount } from '@/features/notifications/hooks'

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const unread = useUnreadCount()
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-astro-surface px-4.5 py-3.5 md:hidden">
      <button type="button" aria-label="Menu" onClick={onMenuClick} className="text-astro-text-muted">
        <MenuIcon className="size-5" />
      </button>
      <Wordmark size={23} className="text-astro-text" />
      <Link
        to="/notifications"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative text-astro-text-muted hover:text-astro-text"
      >
        <BellIcon className="size-5" />
        <UnreadDot count={unread} className="-right-2.5 -top-2" />
      </Link>
    </header>
  )
}
