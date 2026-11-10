import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useMemo, useState } from 'react'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import type { Badge } from './api'
import { BadgeIcon } from './BadgeIcon'
import { BADGE_DEFS, MONTHLY_DEFS, TIER_COLOR, TIER_LABEL, TIER_LASTS, type BadgeDef, type BadgeTier } from './definitions'
import { useBadgeRows, useBadgesByPlayer } from './hooks'

const TIERS: BadgeTier[] = ['cup', 'year', 'month', 'week']
const CUP_FILL = 'linear-gradient(170deg,#ffe2a1,#f2a93b 55%,#a8650f)'

type Filter = 'all' | 'todo' | 'won'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All awards' },
  { id: 'todo', label: 'Still to win' },
  { id: 'won', label: 'Won' },
]

interface AwardSummary {
  key: string
  def: BadgeDef
  holders: Badge[]
  mine: number
  holdingNow: boolean
  everAwarded: number
}

export function AwardsPage() {
  const { player } = useCurrentPlayer()
  const { isLoading } = useBadgeRows()
  const byPlayer = useBadgesByPlayer()
  const [filter, setFilter] = useState<Filter>('all')

  const awards = useMemo(() => {
    const all = [...byPlayer.values()].flat()
    return Object.entries({ ...BADGE_DEFS, ...MONTHLY_DEFS }).map(([key, def]): AwardSummary => {
      const won = all.filter((b) => b.badge_key === key)
      const mine = won.filter((b) => b.player_id === player?.id)
      return {
        key,
        def,
        holders: won.filter((b) => b.active),
        mine: mine.length,
        holdingNow: mine.some((b) => b.active),
        everAwarded: new Set(won.map((b) => b.period_key)).size,
      }
    })
  }, [byPlayer, player?.id])

  if (isLoading) return <PageLoader />

  const wonCount = awards.filter((a) => a.mine > 0).length
  const shown = awards.filter((a) => (filter === 'todo' ? a.mine === 0 : filter === 'won' ? a.mine > 0 : true))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Something to play for</div>
          <h1 className="mb-1.5 mt-1 font-display text-[44px] leading-[0.95] text-astro-text md:text-[56px]">Awards</h1>
          <p className="max-w-[62ch] text-sm text-astro-text-muted">Every badge on offer, what it takes to win it and who holds it now.</p>
        </div>
        {player && (
          <div className="text-right">
            <div className="font-display text-[34px] leading-none text-astro-text">
              {wonCount}
              <span className="text-astro-text-dim"> / {awards.length}</span>
            </div>
            <div className="text-xs text-astro-text-dim">awards you&rsquo;ve won</div>
          </div>
        )}
      </header>

      {player && (
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-[12.5px] font-bold transition-colors',
                filter === f.id
                  ? 'border-astro-accent/55 bg-astro-accent/15 text-astro-text'
                  : 'border-white/[0.08] bg-astro-surface-2 text-astro-text-muted hover:text-astro-text',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {TIERS.map((tier) => {
        const list = shown.filter((a) => a.def.tier === tier)
        if (list.length === 0) return null
        return (
          <section key={tier}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-[30px] leading-none" style={{ color: tier === 'cup' ? '#f7c25e' : TIER_COLOR[tier] }}>
                {TIER_LABEL[tier]}
              </h2>
              <span className="text-xs text-astro-text-dim">Held {TIER_LASTS[tier].toLowerCase()}</span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
              {list.map((a) => (
                <AwardCard key={a.key} award={a} />
              ))}
            </div>
          </section>
        )
      })}

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-8 text-center text-sm text-astro-text-dim">
          {filter === 'won' ? 'Nothing won yet. Plenty to go for.' : 'You’ve won every one of them.'}
        </p>
      )}
    </div>
  )
}

function AwardCard({ award }: { award: AwardSummary }) {
  const { def, holders, mine, holdingNow, everAwarded } = award
  const color = TIER_COLOR[def.tier]
  const won = mine > 0
  return (
    <Link
      to="/awards/$awardKey"
      params={{ awardKey: award.key }}
      className={cn(
        'group flex flex-col gap-3 rounded-2xl border bg-astro-surface p-4 no-underline transition-colors hover:border-white/20',
        holdingNow ? 'border-[color-mix(in_srgb,var(--tier)_45%,transparent)]' : 'border-border',
      )}
      style={{ '--tier': color } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px]', won ? 'border-white/25' : 'border-dashed')}
          style={
            won
              ? { background: def.tier === 'cup' ? CUP_FILL : color, color: '#0a0f1f' }
              : { borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, color }
          }
        >
          <BadgeIcon name={def.icon} className="size-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[22px] leading-none text-astro-text group-hover:underline">{def.name}</div>
          <div className="mt-1 text-[13px] leading-snug text-astro-text-muted">{def.for}</div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-white/[0.08] pt-2.5 text-xs">
        <span className="min-w-0 truncate text-astro-text-dim">
          {holders.length === 0
            ? everAwarded === 0
              ? 'Never won yet'
              : 'Nobody holds it now'
            : `Held by ${holders[0].nickname}${holders.length > 1 ? ` +${holders.length - 1}` : ''}`}
        </span>
        <span className="flex shrink-0 gap-1.5">
          {def.manual && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-bold text-astro-text-muted">Admin pick</span>}
          {won && (
            <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color: def.tier === 'cup' ? '#f7c25e' : color }}>
              {holdingNow ? 'You hold it' : mine > 1 ? `Won ${mine}×` : 'Won'}
            </span>
          )}
        </span>
      </div>
    </Link>
  )
}
