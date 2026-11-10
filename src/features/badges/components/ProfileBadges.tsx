import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Timeline, TimelineItem } from '@/components/timeline/Timeline'
import { dropDate } from '@/features/honours/feed'
import { useCupQuarters } from '@/features/honours/hooks'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { headlineBadges, isNewBadge, type Badge } from '../api'
import { BadgeIcon } from '../BadgeIcon'
import { TIER_COLOR, TIER_LASTS, type BadgeTier } from '../definitions'
import { BadgePatch, BadgeSquare, periodLabel } from './BadgePatch'

const RAIL_MAX = 4

export function BadgeRail({ badges }: { badges: Badge[] }) {
  const shown = headlineBadges(badges)
  if (shown.length === 0) return null
  const extra = badges.filter((b) => b.active).length - Math.min(RAIL_MAX, shown.length)
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
      {shown.slice(0, RAIL_MAX).map((b, i) => (
        <BadgePatch key={b.id} badge={b} showNew delay={50 + i * 100} />
      ))}
      {extra > 0 && (
        <a
          href="#badges"
          className="inline-flex shrink-0 items-center rounded-[10px] border border-dashed border-white/[0.18] px-3 font-display text-lg leading-none text-astro-text-muted no-underline hover:text-astro-text"
          style={{ animation: `astro-rise 550ms cubic-bezier(.2,.8,.2,1) ${50 + RAIL_MAX * 100}ms both` }}
        >
          +{extra} more
        </a>
      )}
    </div>
  )
}

/** Badge squares down the edge of the photo on the player card. */
export function BadgeSleeve({ badges }: { badges: Badge[] }) {
  const shown = headlineBadges(badges).slice(0, 4)
  if (shown.length === 0) return null
  return (
    <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
      {shown.map((b) => (
        <BadgeSquare key={b.id} badge={b} side="right" />
      ))}
    </div>
  )
}

const GROUPS: { key: BadgeTier | 'past'; title: string }[] = [
  { key: 'cup', title: 'Salami Cup' },
  { key: 'year', title: 'Yearly' },
  { key: 'month', title: 'This month' },
  { key: 'week', title: 'This week' },
  { key: 'past', title: 'Past badges' },
]

export function BadgeCabinet({ badges, nickname }: { badges: Badge[]; nickname: string }) {
  const [showAllPast, setShowAllPast] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const active = badges.filter((b) => b.active)
  // Weekly badges come and go every Sunday, so only count them once they've expired.
  const past = badges.filter((b) => !b.active && b.tier !== 'week')
  const pastWeekly = badges.filter((b) => !b.active && b.tier === 'week').length

  return (
    <section id="badges" className="scroll-mt-24 rounded-2xl border border-border bg-astro-surface p-5 md:p-[22px]">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-[30px] leading-none text-astro-text">Badge cabinet</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-astro-text-dim">{active.length} active</span>
          {badges.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="rounded-full border border-white/[0.1] px-3 py-1 text-xs font-bold text-astro-text-muted transition-colors hover:border-astro-accent/50 hover:text-astro-text"
            >
              Everything they&rsquo;ve won ({badges.length})
            </button>
          )}
        </div>
      </div>
      {badges.length === 0 ? (
        <p className="mt-2 text-sm text-astro-text-dim">
          {nickname} hasn&rsquo;t earned a badge yet.{' '}
          <Link to="/awards" className="font-bold text-astro-accent-soft hover:underline">
            See what&rsquo;s up for grabs
          </Link>
        </p>
      ) : (
        GROUPS.map(({ key, title }) => {
          const list = key === 'past' ? past : active.filter((b) => b.tier === key)
          if (list.length === 0 && !(key === 'past' && pastWeekly > 0)) return null
          const visible = key === 'past' && !showAllPast ? list.slice(0, 6) : list
          const color = key === 'past' ? '#6d7496' : TIER_COLOR[key]
          return (
            <div key={key} className="mt-4">
              <div
                className="mb-2 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: key === 'cup' ? '#f7c25e' : color }}
              >
                <span className="size-2 rounded-[2px]" style={{ background: key === 'cup' ? 'linear-gradient(#ffe2a1,#f2a93b)' : color }} />
                {title}
                <span className="text-[11.5px] font-semibold normal-case tracking-normal text-astro-text-dim">
                  {key === 'past'
                    ? pastWeekly > 0
                      ? `Plus ${pastWeekly} weekly badge${pastWeekly === 1 ? '' : 's'} over time`
                      : 'Expired, kept for the record'
                    : TIER_LASTS[key]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visible.map((b, i) => (
                  <BadgePatch key={b.id} badge={b} size={key === 'past' || key === 'week' ? 'sm' : 'lg'} showSub showNew delay={key === 'past' ? -1 : i * 60} />
                ))}
                {key === 'past' && list.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPast((s) => !s)}
                    className="rounded-[10px] border border-dashed border-white/[0.18] px-3 text-xs font-bold text-astro-text-muted hover:text-astro-text"
                  >
                    {showAllPast ? 'Show fewer' : `Show all ${list.length}`}
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
      <BadgeCollection badges={badges} nickname={nickname} open={drawer} onOpenChange={setDrawer} />
    </section>
  )
}

/** Every badge a player has ever won, weekly ones included, by year. */
function BadgeCollection({
  badges,
  nickname,
  open,
  onOpenChange,
}: {
  badges: Badge[]
  nickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: quarters } = useCupQuarters()
  const wonOn = (b: Badge) => dropDate([b], quarters)
  const years = new Map<number, Badge[]>()
  for (const b of [...badges].sort((a, z) => wonOn(z).getTime() - wonOn(a).getTime())) {
    const y = /^\d{4}$/.test(b.period_key) ? Number(b.period_key) : wonOn(b).getFullYear()
    years.set(y, [...(years.get(y) ?? []), b])
  }
  const tally = (['cup', 'year', 'month', 'week'] as BadgeTier[])
    .map((t) => ({ t, n: badges.filter((b) => b.tier === t).length }))
    .filter((x) => x.n > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-white/[0.07] bg-astro-surface p-0 text-astro-text sm:max-w-md">
        <div className="border-b border-white/[0.07] px-6 pb-5 pt-6">
          <SheetTitle className="font-display text-[30px] font-normal leading-none text-astro-text">{nickname}&rsquo;s collection</SheetTitle>
          <SheetDescription className="mt-1.5 text-[13px] text-astro-text-muted">Every badge they&rsquo;ve won, newest first. Tap one to read about the award.</SheetDescription>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tally.map(({ t, n }) => (
              <span
                key={t}
                className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold"
                style={{ borderColor: `color-mix(in srgb, ${TIER_COLOR[t]} 45%, transparent)`, color: t === 'cup' ? '#f7c25e' : TIER_COLOR[t] }}
              >
                {n} {t === 'cup' ? 'Salami Cup' : t === 'year' ? 'yearly' : t === 'month' ? 'monthly' : 'weekly'}
              </span>
            ))}
          </div>
        </div>
        <div className="px-6 py-5">
          {[...years.entries()].map(([year, list]) => (
            <section key={year} className="mb-6 last:mb-0">
              <h3 className="mb-3 font-display text-[22px] leading-none text-astro-text-muted">{year}</h3>
              <Timeline>
                {list.map((b) => (
                  <TimelineItem
                    key={b.id}
                    color={b.tier === 'cup' ? '#f2a93b' : TIER_COLOR[b.tier]}
                    eyebrow={`${wonOn(b).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace('Sept', 'Sep')} · ${b.active ? 'Holding' : 'Past'}`}
                  >
                    <Link
                      to="/awards/$awardKey"
                      params={{ awardKey: b.badge_key }}
                      onClick={() => onOpenChange(false)}
                      className="mt-1 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-astro-surface-sunken px-3 py-2.5 no-underline transition-colors hover:border-astro-accent/40"
                    >
                      <span className={b.active ? undefined : 'opacity-60'}>
                        <BadgeIconTile badge={b} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-extrabold text-astro-text">{b.def.name}</span>
                        <span className="block truncate text-[11.5px] text-astro-text-dim">
                          {/^\d{4}$/.test(b.period_key) ? b.period_key : b.tier === 'cup' ? 'Salami Cup' : periodLabel(b)}
                          {b.stat ? ` · ${b.stat}` : ''}
                        </span>
                      </span>
                    </Link>
                  </TimelineItem>
                ))}
              </Timeline>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** A plain tile: no hover card, since the whole row is already a link. */
function BadgeIconTile({ badge }: { badge: Badge }) {
  return (
    <span
      className="flex size-[30px] items-center justify-center rounded-lg border-[1.5px] border-white/25"
      style={{
        background: badge.tier === 'cup' ? 'linear-gradient(170deg,#ffe2a1,#f2a93b 55%,#a8650f)' : TIER_COLOR[badge.tier],
        color: '#0a0f1f',
      }}
    >
      <BadgeIcon name={badge.def.icon} className="size-[15px]" />
    </span>
  )
}

const DISMISSED_KEY = 'astro.dismissedBadgeBanners'

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Shown to everyone for a week after a cup, yearly or monthly badge goes live. */
export function NewBadgeBanner({ badges, nickname }: { badges: Badge[]; nickname: string }) {
  const [dismissed, setDismissed] = useState(readDismissed)
  const fresh = headlineBadges(badges).find((b) => isNewBadge(b) && !dismissed.includes(b.id))
  if (!fresh) return null
  const isCup = fresh.tier === 'cup'
  const color = TIER_COLOR[fresh.tier]

  function dismiss() {
    const next = [...dismissed, fresh!.id]
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next.slice(-50)))
    } catch {
      // Private mode: the banner just comes back next visit.
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5"
      style={{
        borderColor: isCup ? 'rgba(242,169,59,0.5)' : `color-mix(in srgb, ${color} 45%, transparent)`,
        background: `linear-gradient(110deg, color-mix(in srgb, ${color} 18%, transparent), color-mix(in srgb, ${color} 3%, transparent))`,
        animation: 'astro-rise 500ms cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <BadgeSquare badge={fresh} size={30} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl leading-none text-astro-text">New badge: {fresh.def.name}</div>
        <div className="text-xs text-astro-text-muted">
          {fresh.detail ?? `${nickname} earned it`}
          {fresh.tiedWith.length > 0 && `, shared with ${fresh.tiedWith.map((p) => p.nickname).slice(0, 3).join(', ')}`}
        </div>
      </div>
      <button type="button" onClick={dismiss} className="text-xs font-bold text-astro-text-dim hover:text-astro-text">
        Dismiss
      </button>
    </div>
  )
}

export function holdsCup(badges: Badge[]) {
  return badges.some((b) => b.active && b.badge_key === 'silverware')
}
