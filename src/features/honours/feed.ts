import type { Badge } from '@/features/badges/api'
import type { BadgeTier } from '@/features/badges/definitions'
import type { ClubMoment, HonoursPost } from './api'

/** Every player who shares one award: a tie, or a cup-winning squad. */
export interface BadgeDrop {
  key: string
  badges: Badge[]
  at: Date
}

export type FeedItem =
  | { type: 'post'; at: Date; post: HonoursPost }
  | { type: 'badge'; at: Date; drop: BadgeDrop }
  | { type: 'moment'; at: Date; moment: ClubMoment }

export type FeedFilter = 'all' | 'post' | 'badge' | 'moment'

export function groupDrops(byPlayer: Map<string, Badge[]>, quarters?: Quarters, tiers: BadgeTier[] = ['cup', 'year', 'month']) {
  const groups = new Map<string, Badge[]>()
  for (const b of [...byPlayer.values()].flat()) {
    if (!tiers.includes(b.tier)) continue
    const k = `${b.badge_key}|${b.period_key}`
    groups.set(k, [...(groups.get(k) ?? []), b])
  }
  return [...groups.entries()].map(([key, badges]) => ({
    key,
    badges: badges.sort((a, b) => a.nickname.localeCompare(b.nickname)),
    at: dropDate(badges, quarters),
  }))
}

/** Cup and monthly awards are dated to when they were won, so a late or backfilled award still sorts into place. */
export function dropDate(badges: Badge[], quarters?: Quarters) {
  const live = Math.min(...badges.map((b) => b.liveFrom.getTime()))
  const first = badges[0]
  const played = first.tier === 'cup' ? quarters?.get(first.period_key)?.scheduled_at : undefined
  if (played) return new Date(Math.min(live, new Date(played).getTime()))
  if (/^\d{4}$/.test(first.period_key)) return new Date(Math.min(live, new Date(Number(first.period_key) + 1, 0, 1).getTime()))
  if (first.tier !== 'month') return new Date(live)
  const [y, m] = first.period_key.split('-').map(Number)
  return y && m ? new Date(Math.min(live, new Date(y, m, 1).getTime())) : new Date(live)
}

export function buildFeed(posts: HonoursPost[], drops: BadgeDrop[], moments: ClubMoment[]): FeedItem[] {
  return [
    ...posts.map((post) => ({ type: 'post' as const, at: new Date(post.created_at), post })),
    ...drops.map((drop) => ({ type: 'badge' as const, at: drop.at, drop })),
    ...moments.map((moment) => ({ type: 'moment' as const, at: new Date(moment.happened_at), moment })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime())
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

export function momentTitle(m: ClubMoment, nickname: string | undefined) {
  switch (m.kind) {
    case 'matchdays':
      return m.value === 1 ? 'First matchday on Astro' : `${ordinal(m.value)} matchday`
    case 'club-goals':
      return `${m.value.toLocaleString('en-GB')} Astro goals`
    case 'player-apps':
      return `${nickname ?? 'A player'} reaches ${m.value} appearances`
    case 'player-goals':
      return `${nickname ?? 'A player'} scores goal number ${m.value}`
  }
}

/** Next round number for a counter, and where the current stretch started. */
export function nextTarget(value: number, steps: number[], every: number) {
  const target = steps.find((s) => s > value) ?? (Math.floor(value / every) + 1) * every
  const from = [...steps].reverse().find((s) => s <= value && s < target) ?? Math.floor(value / every) * every
  return { target, progress: Math.min(1, (value - from) / Math.max(1, target - from)) }
}

export interface HallEntry {
  key: string
  name: string
  badges: Badge[]
  /** Cup only: the quarter's label, e.g. "Q2 2026". */
  quarter?: string
  team?: string
}

export interface HallYear {
  year: number
  cups: HallEntry[]
  titles: HallEntry[]
  months: { month: string; index: number; entries: HallEntry[] }[]
}

type Quarters = Map<string, { id: string; label: string; scheduled_at: string }>

/** Everything awarded for each year, newest year first. Expired badges stay on the roll. */
export function buildHallOfFame(byPlayer: Map<string, Badge[]>, quarters: Quarters): HallYear[] {
  const years = new Map<number, HallYear>()
  const yearOf = (y: number) => {
    if (!years.has(y)) years.set(y, { year: y, cups: [], titles: [], months: [] })
    return years.get(y)!
  }

  for (const drop of groupDrops(byPlayer, quarters)) {
    const first = drop.badges[0]
    const entry: HallEntry = { key: drop.key, name: first.def.name, badges: drop.badges }
    if (first.tier === 'cup') {
      const q = quarters.get(first.period_key)
      const year = /^\d{4}$/.test(first.period_key) ? Number(first.period_key) : new Date(q?.scheduled_at ?? first.awarded_at).getFullYear()
      entry.quarter = q?.label
      entry.team = first.detail?.match(/with (.+)$/)?.[1]
      yearOf(year).cups.push(entry)
    } else if (first.tier === 'year') {
      yearOf(Number(first.period_key)).titles.push(entry)
    } else {
      const [y, m] = first.period_key.split('-').map(Number)
      if (!y || !m) continue
      const hy = yearOf(y)
      const month = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long' })
      let bucket = hy.months.find((x) => x.index === m)
      if (!bucket) hy.months.push((bucket = { month, index: m, entries: [] }))
      bucket.entries.push(entry)
    }
  }

  return [...years.values()]
    .map((y) => ({
      ...y,
      cups: y.cups.sort((a, b) => (b.quarter ?? '').localeCompare(a.quarter ?? '')),
      titles: y.titles.sort((a, b) => a.name.localeCompare(b.name)),
      months: y.months.sort((a, b) => b.index - a.index),
    }))
    .sort((a, b) => b.year - a.year)
}
