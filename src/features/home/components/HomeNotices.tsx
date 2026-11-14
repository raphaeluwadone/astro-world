import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { TIER_COLOR } from '@/features/badges/definitions'
import type { FeedItem } from '@/features/honours/feed'
import { LATEST_AMENDMENT } from '@/features/rules/content'
import type { CupQuarter } from '@/features/salami-cup/api'
import { TimedNotice } from '@/components/TimedNotice'
import { cupCountdownTitle, cupEyebrow } from './CupBanner'
import { honourNoticeId } from './LatestHonour'
import { RULES_NOTICE_ID } from './RulesChangedStrip'

interface Notice {
  key: string
  /** Set on notices about the group rather than you: they get a close button and a timer. */
  timedId?: string
  color: string
  eyebrow: string
  title: string
  sub?: string
  cta: string
  to: string
}

function Tile({ n, solo }: { n: Notice; solo: boolean }) {
  const size = cn('shrink-0 snap-start', solo ? 'w-full' : 'w-[84%]')
  const tile = (
    <Link
      to={n.to}
      className={cn('flex h-full flex-col rounded-[14px] border px-4 py-3.5 no-underline', !n.timedId && size, n.timedId && 'pr-10')}
      style={{
        borderColor: `color-mix(in srgb, ${n.color} 45%, transparent)`,
        background: `linear-gradient(120deg, color-mix(in srgb, ${n.color} 16%, transparent), transparent 75%)`,
      }}
    >
      <span className="mb-1 truncate text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: n.color }}>
        {n.eyebrow}
      </span>
      <span className="font-display text-[22px] leading-none text-astro-text">{n.title}</span>
      {n.sub && <span className="mt-1 truncate text-[12.5px] text-astro-text-muted">{n.sub}</span>}
      <span className="mt-auto pt-2 text-[12.5px] font-extrabold" style={{ color: n.color }}>
        {n.cta} &rarr;
      </span>
    </Link>
  )
  if (!n.timedId) return tile
  return (
    <TimedNotice id={n.timedId} className={cn('rounded-[14px]', size)}>
      {tile}
    </TimedNotice>
  )
}

function honourNotice(item: FeedItem): Notice | null {
  const date = item.at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace('Sept', 'Sep')
  if (item.type === 'post') {
    return { key: 'honour', timedId: honourNoticeId(item), color: '#a63fff', eyebrow: `Latest honour · ${date}`, title: item.post.title, cta: 'Honours', to: '/honours' }
  }
  if (item.type === 'badge') {
    const first = item.drop.badges[0]
    const n = item.drop.badges.length
    const who = item.drop.badges.slice(0, 2).map((b) => b.nickname).join(n === 2 ? ' and ' : ', ')
    return {
      key: 'honour',
      timedId: honourNoticeId(item),
      color: first.tier === 'cup' ? '#f2a93b' : TIER_COLOR[first.tier],
      eyebrow: `Latest honour · ${date}`,
      title: first.def.name,
      sub: `${n > 1 ? 'Shared by' : 'Won by'} ${who}${n > 2 ? ` and ${n - 2} more` : ''}`,
      cta: 'Honours',
      to: '/honours',
    }
  }
  return null
}

/** Phones only: the home banners as one row of small cards you swipe through. */
export function HomeNotices({ honour, cup, rulesChanged }: { honour: FeedItem | null; cup: CupQuarter | null; rulesChanged: boolean }) {
  const notices: Notice[] = []
  if (cup) {
    notices.push({ key: 'cup', color: '#f2a93b', eyebrow: cupEyebrow(cup), title: cupCountdownTitle(cup), cta: 'Open the cup', to: '/salami-cup' })
  }
  if (rulesChanged) {
    notices.push({ key: 'rules', timedId: RULES_NOTICE_ID, color: '#f2a93b', eyebrow: 'Rules changed', title: LATEST_AMENDMENT.headline, cta: 'Read the changes', to: '/rules' })
  }
  const h = honour && honourNotice(honour)
  if (h) notices.push(h)
  if (notices.length === 0) return null

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {notices.map((n) => (
        <Tile key={n.key} n={n} solo={notices.length === 1} />
      ))}
    </div>
  )
}
