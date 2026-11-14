import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from 'cn'
import { usePendingClaims } from '../hooks'

export function MembersTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: claims = [] } = usePendingClaims()
  const tabs = [
    { to: '/admin/members', label: 'Roster', active: !pathname.startsWith('/admin/members/claims') },
    { to: '/admin/members/claims', label: 'Record claims', active: pathname.startsWith('/admin/members/claims'), badge: claims.length },
  ] as const
  return (
    <div className="mb-6 flex gap-1 border-b border-white/[0.09]">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={cn(
            '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-bold no-underline',
            t.active ? 'border-astro-cyan text-astro-text' : 'border-transparent text-astro-text-muted hover:text-astro-text',
          )}
        >
          {t.label}
          {'badge' in t && t.badge > 0 && (
            <span className="flex h-[18px] min-w-[19px] items-center justify-center rounded-full bg-astro-red px-1.5 text-[10px] font-extrabold text-white">{t.badge}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
