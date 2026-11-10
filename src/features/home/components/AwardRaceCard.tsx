import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { BadgeIcon } from '@/features/badges/BadgeIcon'
import { badgeDef, TIER_COLOR } from '@/features/badges/definitions'
import type { AwardRaceRow } from '../api'

const RATING_KEYS = new Set(['month-player-of-the-month', 'messi-ah'])
const UNITS: Record<string, [string, string]> = {
  'month-golden-boot': ['goal', 'goals'],
  'ronaldo-without-the-abs': ['goal', 'goals'],
  'month-playmaker': ['assist', 'assists'],
  'mesuts-apprentice': ['assist', 'assists'],
  'month-golden-glove': ['clean sheet', 'clean sheets'],
  'clean-freak': ['clean sheet', 'clean sheets'],
  'main-character': ['MOTM win', 'MOTM wins'],
  'most-capped': ['appearance', 'appearances'],
}
const YEAR_ROWS = 4

function amount(key: string, v: number) {
  if (RATING_KEYS.has(key)) return `${v.toFixed(2)} avg`
  const [one, many] = UNITS[key] ?? ['', '']
  return `${v} ${v === 1 ? one : many}`
}

function others(n: number) {
  return `${n} ${n === 1 ? 'other' : 'others'}`
}

/** Leading first, then the races the player is closest to winning. */
function closeness(r: AwardRaceRow) {
  if (r.my_rank === 1) return -1
  if (r.mine == null || !r.leader) return 2
  return 1 - r.mine / r.leader
}

function status(r: AwardRaceRow): { text: string; tone: 'lead' | 'chase' | 'open' } {
  const lead = r.leaders[0]
  if (!r.leader || r.contenders === 0) return { text: 'Up for grabs', tone: 'open' }
  if (r.my_rank === 1) {
    return { text: r.leaders.length > 1 ? `Joint lead with ${others(r.leaders.length - 1)}` : 'You lead', tone: 'lead' }
  }
  const leaderName = r.leaders.length > 1 ? `${lead} +${r.leaders.length - 1}` : lead
  if (r.mine == null) return { text: `${leaderName} leads on ${amount(r.badge_key, r.leader)}`, tone: 'open' }
  const gap = RATING_KEYS.has(r.badge_key) ? `${(r.leader - r.mine).toFixed(2)}` : amount(r.badge_key, r.leader - r.mine)
  return { text: `${gap} behind ${leaderName}`, tone: 'chase' }
}

function RaceRow({ row }: { row: AwardRaceRow }) {
  const def = badgeDef(row.badge_key, null)
  const color = TIER_COLOR[def.tier]
  const s = status(row)
  const pct = row.leader && row.mine != null ? Math.max(4, Math.min(100, (row.mine / row.leader) * 100)) : 0
  return (
    <Link
      to="/awards/$awardKey"
      params={{ awardKey: row.badge_key }}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 no-underline transition-colors hover:bg-white/[0.04]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: color, color: '#0a0f1f' }}>
        <BadgeIcon name={def.icon} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13.5px] font-extrabold text-astro-text group-hover:underline">{def.name}</span>
          {row.my_rank != null && <span className="shrink-0 text-[11px] font-bold text-astro-text-dim">#{row.my_rank}</span>}
        </span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: color }} />
        </span>
        <span
          className={cn(
            'mt-1 block truncate text-[11.5px]',
            s.tone === 'lead' ? 'font-bold' : s.tone === 'chase' ? 'text-astro-text-muted' : 'text-astro-text-dim',
          )}
          style={s.tone === 'lead' ? { color } : undefined}
        >
          {row.mine != null && s.tone !== 'open' ? `${amount(row.badge_key, row.mine)} · ` : ''}
          {s.text}
        </span>
      </span>
    </Link>
  )
}

export function AwardRaceCard({ race }: { race: AwardRaceRow[] }) {
  const month = race.filter((r) => r.scope === 'month')
  const year = race
    .filter((r) => r.scope === 'year' && r.contenders > 0)
    .sort((a, b) => closeness(a) - closeness(b))
    .slice(0, YEAR_ROWS)
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' })
  const monthStarted = month.some((r) => r.contenders > 0)

  return (
    <section className="astro-card p-5 md:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Race for the awards</h2>
        <Link to="/awards" className="text-[12.5px] font-bold text-astro-accent-soft no-underline hover:underline">
          All awards &rarr;
        </Link>
      </div>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div>
          <div className="mb-1 px-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]" style={{ color: TIER_COLOR.month }}>
            {monthName}
          </div>
          {monthStarted ? (
            month.map((r) => <RaceRow key={r.badge_key} row={r} />)
          ) : (
            <p className="px-2 py-3 text-[13px] leading-relaxed text-astro-text-muted">
              No games yet in {monthName}. Golden Boot, Playmaker, Golden Glove and Player of the Month are all up for grabs.
            </p>
          )}
        </div>
        <div>
          <div className="mb-1 px-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]" style={{ color: TIER_COLOR.year }}>
            {new Date().getFullYear()} titles, closest for you
          </div>
          {year.length > 0 ? (
            year.map((r) => <RaceRow key={r.badge_key} row={r} />)
          ) : (
            <p className="px-2 py-3 text-[13px] text-astro-text-muted">The yearly races start with the first game of the year.</p>
          )}
        </div>
      </div>
    </section>
  )
}
