import { BadgeHoverCard } from '@/features/badges/components/BadgeHoverCard'
import { Link } from '@tanstack/react-router'
import { TIER_COLOR } from '@/features/badges/definitions'
import type { FeedItem } from '@/features/honours/feed'

const SHOW_FOR_DAYS = 14

/** The newest honours post or title drop, if it landed in the last two weeks. */
export function recentHonour(feed: FeedItem[], now = Date.now()) {
  const item = feed.find((i) => i.type !== 'moment')
  if (!item || now - item.at.getTime() > SHOW_FOR_DAYS * 24 * 60 * 60 * 1000) return null
  return item
}

function names(list: string[]) {
  if (list.length <= 2) return list.join(' and ')
  return `${list.slice(0, 2).join(', ')} and ${list.length - 2} more`
}

export function LatestHonour({ item }: { item: FeedItem }) {
  let color = '#a63fff'
  let headline = ''
  let sub = ''
  if (item.type === 'post') {
    headline = item.post.title
    sub = item.post.author ? `A write-up by ${item.post.author.nickname}` : 'A new write-up'
  } else if (item.type === 'badge') {
    const first = item.drop.badges[0]
    color = first.tier === 'cup' ? '#f2a93b' : TIER_COLOR[first.tier]
    headline = first.def.name
    sub = `${item.drop.badges.length > 1 ? 'Shared by' : 'Won by'} ${names(item.drop.badges.map((b) => b.nickname))}`
  }
  const date = item.at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace('Sept', 'Sep')

  return (
    <Link
      to="/honours"
      className="group flex items-center gap-4 rounded-[14px] border px-5 py-3.5 no-underline transition-colors hover:bg-white/[0.03]"
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        background: `linear-gradient(120deg, color-mix(in srgb, ${color} 14%, transparent), transparent 70%)`,
      }}
    >
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 0 4px color-mix(in srgb, ${color} 22%, transparent)` }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color }}>
          Latest honour &middot; {date}
        </span>
        <span className="block truncate">
          {item.type === 'badge' ? (
            <BadgeHoverCard awardKey={item.drop.badges[0].badge_key} triggerClassName="inline rounded font-display text-[22px] leading-none text-astro-text cursor-pointer hover:underline">
              {headline}
            </BadgeHoverCard>
          ) : (
            <span className="font-display text-[22px] leading-none text-astro-text">{headline}</span>
          )}
          <span className="ml-2 text-[13px] text-astro-text-muted">{sub}</span>
        </span>
      </span>
      <span className="shrink-0 text-[12.5px] font-extrabold text-astro-accent-soft group-hover:underline">Honours &rarr;</span>
    </Link>
  )
}
