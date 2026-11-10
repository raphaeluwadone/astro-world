import { NothingHere } from '@/components/states/NothingHere'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { isToday, isYesterday } from 'date-fns'
import { useState } from 'react'
import { PageLoader } from '@/components/states/PageLoader'
import type { NotificationRow } from './api'
import { useMarkRead, useNotifications, useUnreadCount } from './hooks'
import { NotificationItem } from './NotificationItem'

function dayLabel(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function NotificationsPage() {
  const { data = [], isLoading } = useNotifications()
  const unread = useUnreadCount()
  const markRead = useMarkRead()
  const [onlyUnread, setOnlyUnread] = useState(false)

  if (isLoading) return <PageLoader />

  const shown = onlyUnread ? data.filter((n) => !n.read_at) : data
  const groups: { label: string; items: NotificationRow[] }[] = []
  for (const n of shown) {
    const label = dayLabel(n.created_at)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[44px] leading-[0.95] text-astro-text md:text-[56px]">Notifications</h1>
          <p className="mt-1 text-sm text-astro-text-muted">
            Choose which of these also come by email in{' '}
            <Link to="/profile/edit" hash="email-settings" className="font-bold text-astro-accent hover:underline">
              email settings
            </Link>
            .
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markRead.mutate(null)}
            className="rounded-full border border-white/[0.08] bg-astro-surface-2 px-3 py-1 text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            Mark all as read
          </button>
        )}
      </header>

      <div className="flex gap-1.5">
        {[
          { id: false, label: 'All' },
          { id: true, label: `Unread${unread ? ` · ${unread}` : ''}` },
        ].map((f) => (
          <button
            key={String(f.id)}
            type="button"
            aria-pressed={onlyUnread === f.id}
            onClick={() => setOnlyUnread(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12.5px] font-bold transition-colors',
              onlyUnread === f.id
                ? 'border-astro-accent/55 bg-astro-accent/15 text-astro-text'
                : 'border-white/[0.08] bg-astro-surface-2 text-astro-text-muted hover:text-astro-text',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <NothingHere
          compact
          title={onlyUnread ? 'All caught up' : 'Empty pitch'}
          body={onlyUnread ? 'Nothing unread.' : 'Nothing yet. Badges, matchday news and mentions land here.'}
        />
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <div className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">{g.label}</div>
            <div className="astro-card flex flex-col gap-0.5 p-1.5">
              {g.items.map((n) => (
                <NotificationItem key={n.id} n={n} onOpen={(item) => !item.read_at && markRead.mutate([item.id])} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
