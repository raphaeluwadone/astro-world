import { Link, useNavigate } from '@tanstack/react-router'
import { HoverCard } from 'radix-ui'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { isNewBadge, type Badge } from '../api'
import { TIER_COLOR, TIER_LABEL } from '../definitions'

const GOLD = 'linear-gradient(90deg,#ffe2a1,#f2a93b)'

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace('Sept', 'Sep')
}

function timeLeft(b: Badge) {
  if (!b.active) return `Expired ${fmt(b.expires_at)}`
  if (b.tier === 'cup' && !/^\d{4}$/.test(b.period_key)) return 'Until the next cup'
  if (b.tier === 'week' || b.tier === 'month') return `Until ${fmt(b.expires_at)}`
  const months = Math.round((new Date(b.expires_at).getTime() - Date.now()) / (30.4 * 24 * 60 * 60 * 1000))
  if (months >= 1) return `${months} month${months === 1 ? '' : 's'} left`
  const days = Math.max(1, Math.ceil((new Date(b.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
  return `${days} day${days === 1 ? '' : 's'} left`
}

/** Opens after a short pause on hover or focus; a tap opens it on touch screens. */
export function BadgeHoverCard({ badge, children, side = 'bottom' }: { badge: Badge; children: ReactNode; side?: 'bottom' | 'right' | 'top' }) {
  const [open, setOpen] = useState(false)
  const pointer = useRef<string>('mouse')
  const navigate = useNavigate()
  const goToAward = () => navigate({ to: '/awards/$awardKey', params: { awardKey: badge.badge_key } })
  const color = TIER_COLOR[badge.tier]
  const isCup = badge.tier === 'cup'

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={400} closeDelay={80}>
      <HoverCard.Trigger asChild>
        <span
          tabIndex={0}
          className="inline-flex rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-astro-accent/60"
          onPointerDown={(e) => (pointer.current = e.pointerType)}
          role="link"
          aria-label={`${badge.def.name}: about this award`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // On touch the first tap shows the card, which has its own link through.
            if (pointer.current === 'touch') setOpen((o) => !o)
            else goToAward()
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            e.stopPropagation()
            goToAward()
          }}
        >
          {children}
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side={side}
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[270px] rounded-b-xl rounded-t-[4px] border border-white/[0.12] bg-[#16213f] px-3.5 pb-3 pt-3 text-left shadow-[0_20px_44px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in-0"
          style={{ borderTop: `3px solid ${color}` } as CSSProperties}
        >
          <div className="mb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: isCup ? '#f7c25e' : color }}>
            <span>
              {TIER_LABEL[badge.tier]} badge{badge.tiedWith.length > 0 ? ' · joint' : ''}
            </span>
            {isNewBadge(badge) && <span className="rounded-full bg-[#ffd23f] px-1.5 py-px text-[9px] tracking-[0.08em] text-[#1a1300]">NEW</span>}
          </div>
          <div className="font-display text-[24px] leading-none text-astro-text">{badge.def.name}</div>
          <div className="mb-2 mt-1 text-xs text-astro-text-muted">{badge.def.for}</div>
          {(badge.detail || badge.stat) && (
            <div className="mb-2 text-[12.5px] text-astro-text">
              {badge.detail}
              {badge.detail && badge.stat ? ' · ' : ''}
              {badge.stat}
            </div>
          )}
          {badge.active && (
            <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full" style={{ width: `${Math.round(badge.remaining * 100)}%`, background: isCup ? GOLD : color }} />
            </div>
          )}
          <div className="flex justify-between text-[11px] text-astro-text-dim">
            <span>Earned {fmt(badge.liveFrom)}</span>
            <span>{timeLeft(badge)}</span>
          </div>
          <Link
            to="/awards/$awardKey"
            params={{ awardKey: badge.badge_key }}
            className="mt-2.5 block text-xs font-bold text-astro-accent-soft hover:underline"
          >
            About this award &rarr;
          </Link>
          {badge.tiedWith.length > 0 && (
            <div className="mt-2.5 border-t border-white/[0.08] pt-2.5 text-xs text-astro-text-muted">
              <span className="font-bold text-astro-text">Shared with </span>
              {badge.tiedWith.slice(0, 4).map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <Link to="/players/$playerId" params={{ playerId: p.id }} className="font-bold text-astro-accent-soft hover:underline">
                    {p.nickname}
                  </Link>
                </span>
              ))}
              {badge.tiedWith.length > 4 && ` and ${badge.tiedWith.length - 4} more`}
              . Level on {badge.stat ?? 'the same score'}.
            </div>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
