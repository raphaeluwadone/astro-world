import { cn } from 'cn'
import type { CSSProperties } from 'react'
import { isNewBadge, type Badge } from '../api'
import { BadgeIcon } from '../BadgeIcon'
import { TIER_COLOR } from '../definitions'
import { BadgeHoverCard } from './BadgeHoverCard'

const GOLD_FILL = 'linear-gradient(170deg,#ffe2a1,#f2a93b 55%,#a8650f)'
const GOLD_TEXT = 'bg-[linear-gradient(180deg,#ffe8b5,#f2a93b)] bg-clip-text text-transparent'

function iconFill(b: Badge) {
  const c = TIER_COLOR[b.tier]
  if (!b.active) return '#283255'
  if (b.tier === 'cup') return GOLD_FILL
  if (b.tiedWith.length > 0) return `repeating-linear-gradient(135deg,${c} 0 6px,color-mix(in srgb,${c} 62%,#0a0f1f) 6px 12px)`
  return c
}

// One light edge on monthly icon blocks, a double edge on yearly ones, so tiers differ without colour.
const TIER_EDGE: Partial<Record<Badge['tier'], string>> = {
  month: 'inset -3px 0 0 rgba(255,255,255,0.35)',
  year: 'inset -3px 0 0 rgba(255,255,255,0.35), inset -6px 0 0 rgba(10,15,31,0.25)',
}

export function BadgePatch({
  badge,
  size = 'sm',
  showNew = false,
  showSub = false,
  delay = 0,
}: {
  badge: Badge
  size?: 'sm' | 'lg'
  showNew?: boolean
  showSub?: boolean
  delay?: number
}) {
  const c = badge.active ? TIER_COLOR[badge.tier] : '#4d5578'
  const isCup = badge.tier === 'cup' && badge.active
  const lg = size === 'lg'
  const week = badge.tier === 'week'
  const sub = badge.tiedWith.length > 0 ? 'Joint' : badge.title && badge.tier === 'month' ? periodLabel(badge) : badge.tier === 'week' ? periodLabel(badge) : null

  return (
    <BadgeHoverCard badge={badge}>
      <span
        className={cn(
          'relative inline-flex items-stretch overflow-hidden border',
          week ? 'rounded-lg' : 'rounded-[10px]',
          !badge.active && 'opacity-80',
          isCup && 'shadow-[0_0_22px_rgba(242,169,59,0.22)]',
        )}
        style={
          {
            borderColor: isCup ? 'rgba(242,169,59,0.75)' : `color-mix(in srgb, ${c} 45%, transparent)`,
            background: isCup
              ? 'linear-gradient(120deg,rgba(242,169,59,0.24),rgba(242,169,59,0.05))'
              : `color-mix(in srgb, ${c} 11%, #0f1730)`,
            animation: delay >= 0 ? `astro-rise 550ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` : undefined,
          } as CSSProperties
        }
      >
        <span
          className={cn('flex shrink-0 items-center justify-center', lg ? 'w-[50px]' : week ? 'w-7' : 'w-[34px]')}
          style={{ background: iconFill(badge), color: badge.active ? '#0a0f1f' : '#8b93b8', boxShadow: badge.active ? TIER_EDGE[badge.tier] : undefined }}
        >
          <BadgeIcon name={badge.def.icon} className={lg ? 'size-6' : 'size-4'} />
        </span>
        <span className={cn('flex flex-col justify-center', lg ? 'py-[11px] pl-3.5 pr-4' : 'py-1.5 pl-2.5 pr-3')}>
          <span
            className={cn(
              'font-display whitespace-nowrap leading-none',
              lg ? 'text-[24px]' : week ? 'text-base' : 'text-lg',
              isCup ? GOLD_TEXT : badge.active ? (badge.tier === 'year' ? 'text-[#efe3ff]' : 'text-astro-text') : 'text-astro-text-muted',
            )}
          >
            {badge.def.name}
          </span>
          {(lg || showSub) && sub && <span className="mt-0.5 whitespace-nowrap text-[10.5px] text-astro-text-muted">{sub}</span>}
        </span>
        {showNew && isNewBadge(badge) && (
          <span className="mr-2.5 self-center rounded-full bg-[#ffd23f] px-1.5 py-px text-[9px] font-extrabold tracking-[0.08em] text-[#1a1300]">NEW</span>
        )}
        {isCup && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.35) 50%,transparent 65%)',
              animation: 'astro-badge-sheen 3.2s ease-in-out 1s infinite',
            }}
          />
        )}
      </span>
    </BadgeHoverCard>
  )
}

export function periodLabel(b: Badge) {
  if (b.tier === 'month') {
    const [y, m] = b.period_key.split('-').map(Number)
    if (y && m) return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long' })
  }
  return new Date(b.awarded_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Small square used on the player card and beside names. */
export function BadgeSquare({ badge, size = 30, side }: { badge: Badge; size?: number; side?: 'bottom' | 'right' | 'top' }) {
  return (
    <BadgeHoverCard badge={badge} side={side}>
      <span
        className="relative flex items-center justify-center border-[1.5px] border-white/25 shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
        style={{ width: size, height: size, borderRadius: size > 20 ? 8 : 5, background: iconFill(badge), color: '#0a0f1f' }}
        aria-label={badge.tiedWith.length > 0 ? `${badge.def.name} (joint)` : badge.def.name}
      >
        <BadgeIcon name={badge.def.icon} style={{ width: size * 0.5, height: size * 0.5 }} />
        {badge.tiedWith.length > 0 && <JointNotch size={Math.max(9, Math.round(size * 0.5))} color={TIER_COLOR[badge.tier]} />}
      </span>
    </BadgeHoverCard>
  )
}

/** "=" in the corner of a small mark, since tie stripes don't read at name size. */
function JointNotch({ size, color }: { size: number; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute flex items-center justify-center rounded-full border"
      style={{ width: size, height: size, top: -size * 0.4, right: -size * 0.4, background: '#0a0f1f', borderColor: color, color }}
    >
      <svg viewBox="0 0 10 10" style={{ width: size * 0.6, height: size * 0.6 }}>
        <path d="M2 3.6h6M2 6.4h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}
