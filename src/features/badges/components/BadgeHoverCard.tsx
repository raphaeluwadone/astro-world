import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { HoverCard } from 'radix-ui'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useHoverCards } from '@/lib/hoverCards'
import { isNewBadge, type Badge } from '../api'
import { badgeDef, TIER_COLOR, TIER_LABEL, TIER_LASTS } from '../definitions'
import { useBadgesByPlayer } from '../hooks'
import { AwardIconTile } from './AwardIconTile'

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

function CurrentHolders({ awardKey }: { awardKey: string }) {
  const byPlayer = useBadgesByPlayer()
  const holders = [...byPlayer.values()].flat().filter((b) => b.badge_key === awardKey && b.active)
  if (holders.length === 0) return <div className="text-xs text-astro-text-dim">Nobody holds it right now.</div>
  return (
    <div className="text-xs text-astro-text-muted">
      <span className="font-bold text-astro-text">Held by </span>
      {holders.slice(0, 4).map((h, i) => (
        <span key={h.id}>
          {i > 0 && ', '}
          <Link to="/players/$playerId" params={{ playerId: h.player_id }} className="font-bold text-astro-accent-soft hover:underline">
            {h.nickname}
          </Link>
        </span>
      ))}
      {holders.length > 4 && ` and ${holders.length - 4} more`}
    </div>
  )
}

/**
 * About-this-award card. Pass a player's `badge` for their copy of it, or just an `awardKey` for the award itself.
 * Opens after a short pause on hover or focus; a tap opens it on touch screens.
 */
export function BadgeHoverCard({
  badge,
  awardKey,
  children,
  side = 'bottom',
  triggerClassName,
}: {
  badge?: Badge
  awardKey?: string
  children: ReactNode
  side?: 'bottom' | 'right' | 'top'
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const pointer = useRef<string>('mouse')
  const cards = useHoverCards()
  const navigate = useNavigate()
  const key = badge?.badge_key ?? awardKey ?? ''
  const def = badge?.def ?? badgeDef(key, null)
  const tier = badge?.tier ?? def.tier
  const goToAward = () => navigate({ to: '/awards/$awardKey', params: { awardKey: key } })
  const color = TIER_COLOR[tier]
  const isCup = tier === 'cup'

  return (
    <HoverCard.Root open={cards && open} onOpenChange={setOpen} openDelay={400} closeDelay={80}>
      <HoverCard.Trigger asChild>
        <span
          tabIndex={0}
          className={cn(triggerClassName ?? 'inline-flex rounded-[10px]', 'outline-none focus-visible:ring-2 focus-visible:ring-astro-accent/60')}
          onPointerDown={(e) => (pointer.current = e.pointerType)}
          role="link"
          aria-label={`${def.name}: about this award`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // On touch the first tap shows the card, which has its own link through.
            if (cards && pointer.current === 'touch') setOpen((o) => !o)
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
          <div className="mb-2 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: isCup ? '#f7c25e' : color }}>
                <span>
                  {TIER_LABEL[tier]} badge{badge && badge.tiedWith.length > 0 ? ' · joint' : ''}
                </span>
                {badge && isNewBadge(badge) && <span className="rounded-full bg-[#ffd23f] px-1.5 py-px text-[9px] tracking-[0.08em] text-[#1a1300]">NEW</span>}
              </div>
              <div className="font-display text-[24px] leading-none text-astro-text">{def.name}</div>
              <div className="mt-1 text-xs text-astro-text-muted">{def.for}</div>
            </div>
            <AwardIconTile awardKey={key} icon={def.icon} tier={tier} />
          </div>
          {!badge && (
            <>
              <div className="mb-2 text-[11px] text-astro-text-dim">Held {TIER_LASTS[tier].toLowerCase()}</div>
              <CurrentHolders awardKey={key} />
            </>
          )}
          {badge && (badge.detail || badge.stat) && (
            <div className="mb-2 text-[12.5px] text-astro-text">
              {badge.detail}
              {badge.detail && badge.stat ? ' · ' : ''}
              {badge.stat}
            </div>
          )}
          {badge?.active && (
            <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full" style={{ width: `${Math.round(badge.remaining * 100)}%`, background: isCup ? GOLD : color }} />
            </div>
          )}
          {badge && (
            <div className="flex justify-between text-[11px] text-astro-text-dim">
              <span>Earned {fmt(badge.liveFrom)}</span>
              <span>{timeLeft(badge)}</span>
            </div>
          )}
          <Link
            to="/awards/$awardKey"
            params={{ awardKey: key }}
            className="mt-2.5 block text-xs font-bold text-astro-accent-soft hover:underline"
          >
            About this award &rarr;
          </Link>
          {badge && badge.tiedWith.length > 0 && (
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
