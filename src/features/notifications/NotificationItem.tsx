import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { formatDistanceToNowStrict } from 'date-fns'
import type { NotificationRow } from './api'
import { formatNotification } from './format'

export function NotificationItem({ n, onOpen, compact }: { n: NotificationRow; onOpen: (n: NotificationRow) => void; compact?: boolean }) {
  const f = formatNotification(n)
  const Icon = f.icon
  const unread = !n.read_at
  return (
    <Link
      to={n.link ?? '/'}
      onClick={() => onOpen(n)}
      className={cn(
        'group flex items-start gap-3 rounded-xl border px-3 no-underline transition-colors hover:bg-white/[0.05]',
        compact ? 'py-3' : 'px-4 py-4',
        unread ? 'border-astro-accent/25 bg-astro-accent/[0.06]' : compact ? 'border-transparent' : 'border-white/[0.07] bg-astro-surface',
      )}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${f.color} 16%, transparent)`, color: f.color }}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13.5px] leading-snug', unread ? 'font-bold text-astro-text' : 'font-semibold text-astro-text-muted')}>{f.title}</span>
        {f.body && <span className={cn('mt-0.5 block text-[12.5px] leading-snug text-astro-text-dim', compact && 'line-clamp-2')}>{f.body}</span>}
        <span className="mt-1 block text-[11px] text-astro-text-dim">{formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}</span>
      </span>
      {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-astro-accent" aria-label="Unread" />}
    </Link>
  )
}
