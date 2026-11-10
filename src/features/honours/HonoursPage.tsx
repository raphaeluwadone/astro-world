import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { useMemo, useState, type ReactNode } from 'react'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useBadgeRows, useBadgesByPlayer } from '@/features/badges/hooks'
import type { ClubTotals, HonoursPost } from './api'
import { ClubCounters } from './components/ClubCounters'
import { BadgeDropRow, MomentRow, useMomentNames } from './components/FeedRows'
import { HallOfFameCompact, HonoursBoard, MonthlyRoll } from './components/HallOfFame'
import { HonoursComposer } from './components/HonoursComposer'
import { HonoursPostCard } from './components/HonoursPostCard'
import { buildFeed, buildHallOfFame, groupDrops, type FeedFilter, type FeedItem, type HallYear } from './feed'
import { useClubMoments, useClubTotals, useCupQuarters, useHonoursPosts } from './hooks'

export type HonoursView = 'latest' | 'roll' | 'history'

const VIEWS: { id: HonoursView; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'roll', label: 'Roll of honour' },
  { id: 'history', label: 'History' },
]

const LATEST_LIMIT = 20

function Item({ item, playerId, isAdmin, names }: { item: FeedItem; playerId: string | null; isAdmin: boolean; names: Map<string, string> }) {
  if (item.type === 'post') return <HonoursPostCard post={item.post} playerId={playerId} isAdmin={isAdmin} />
  if (item.type === 'badge') return <BadgeDropRow drop={item.drop} />
  return <MomentRow moment={item.moment} names={names} />
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-white/[0.1] px-5 py-8 text-center text-sm text-astro-text-dim">{children}</p>
}

interface ViewProps {
  feed: FeedItem[]
  posts: HonoursPost[]
  totals: ClubTotals | undefined
  hall: HallYear[]
  year: number
  setYear: (y: number) => void
  playerId: string | null
  isAdmin: boolean
  names: Map<string, string>
}

function LatestView({ feed, posts, totals, hall, year, setYear, playerId, isAdmin, names }: ViewProps) {
  const pinned = posts.find((p) => p.pinned)
  const rest = feed.filter((i) => !(i.type === 'post' && i.post.pinned)).slice(0, LATEST_LIMIT)
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        {isAdmin && playerId && <HonoursComposer authorId={playerId} />}
        {pinned && <HonoursPostCard post={pinned} playerId={playerId} isAdmin={isAdmin} />}
        {rest.map((item) => (
          <Item key={`${item.type}-${item.type === 'post' ? item.post.id : item.type === 'badge' ? item.drop.key : `${item.moment.kind}${item.moment.value}${item.moment.player_id}`}`} item={item} playerId={playerId} isAdmin={isAdmin} names={names} />
        ))}
        {!pinned && rest.length === 0 && <Empty>No honours yet. Titles, cups and write-ups land here as they happen.</Empty>}
        {feed.length > LATEST_LIMIT && (
          <Link to="/honours" search={{ view: 'history' }} className="self-start text-[13px] font-bold text-astro-accent-soft hover:underline">
            See everything in History
          </Link>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {totals && (
          <div className="astro-card p-5">
            <h2 className="mb-3 font-display text-[28px] leading-none text-astro-text">Astro milestones</h2>
            <ClubCounters totals={totals} />
          </div>
        )}
        <HallOfFameCompact
          hall={hall}
          year={year}
          onYear={setYear}
          footer={
            hall.length > 0 && (
              <Link to="/honours" search={{ view: 'roll', year }} className="mt-3 inline-block text-[13px] font-bold text-astro-accent-soft hover:underline">
                Full roll of honour
              </Link>
            )
          }
        />
      </div>
    </div>
  )
}

function RollView({ totals, hall, year, setYear }: ViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <HonoursBoard hall={hall} year={year} onYear={setYear} />
      {totals && <ClubCounters totals={totals} layout="strip" />}
      <MonthlyRoll year={hall.find((h) => h.year === year)} />
    </div>
  )
}

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'post', label: 'Write-ups' },
  { id: 'badge', label: 'Badges' },
  { id: 'moment', label: 'Astro milestones' },
]

function HistoryView({ feed, totals, playerId, isAdmin, names }: ViewProps) {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const shown = filter === 'all' ? feed : feed.filter((i) => i.type === filter)
  const months: { label: string; items: FeedItem[] }[] = []
  for (const item of shown) {
    const label = item.at.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const last = months[months.length - 1]
    if (last?.label === label) last.items.push(item)
    else months.push({ label, items: [item] })
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-1.5">
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
        {months.length === 0 ? (
          <div className="mt-4">
            <Empty>Nothing here yet.</Empty>
          </div>
        ) : (
          <div className="relative pl-7 before:absolute before:bottom-0 before:left-[9px] before:top-1.5 before:w-0.5 before:bg-[linear-gradient(#a63fff,rgba(166,63,255,0.1))]">
            {months.map((m) => (
              <section key={m.label}>
                <h2 className="relative mb-2.5 mt-5 font-display text-[22px] leading-none text-astro-text-muted before:absolute before:-left-6 before:top-0.5 before:size-3 before:rounded-full before:border-2 before:border-astro-accent before:bg-astro-bg">
                  {m.label}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {m.items.map((item, i) => (
                    <div key={i} className="relative before:absolute before:-left-[22px] before:top-[18px] before:size-2 before:rounded-full before:bg-[#2c3c74]">
                      <Item item={item} playerId={playerId} isAdmin={isAdmin} names={names} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      {totals && (
        <aside className="hidden xl:block">
          <ClubCounters totals={totals} layout="column" />
        </aside>
      )}
    </div>
  )
}

export function HonoursPage({ view = 'latest', year: yearParam }: { view?: HonoursView; year?: number }) {
  const navigate = useNavigate()
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null
  const isAdmin = !!player?.is_admin

  const posts = useHonoursPosts(playerId)
  const badgeRows = useBadgeRows()
  const byPlayer = useBadgesByPlayer()
  const { data: totals } = useClubTotals()
  const { data: moments = [] } = useClubMoments()
  const { data: quarters } = useCupQuarters()
  const names = useMomentNames()

  const hall = useMemo(() => buildHallOfFame(byPlayer, quarters ?? new Map()), [byPlayer, quarters])
  const feed = useMemo(() => buildFeed(posts.data ?? [], groupDrops(byPlayer, quarters), moments), [posts.data, byPlayer, quarters, moments])
  const year = yearParam ?? hall[0]?.year ?? new Date().getFullYear()

  const setYear = (y: number) => navigate({ to: '/honours', search: { view, year: y }, replace: true, resetScroll: false })

  if (posts.isLoading || badgeRows.isLoading) return <PageLoader />
  if (posts.isError) return <ErrorState onRetry={() => posts.refetch()} />

  const props: ViewProps = { feed, posts: posts.data ?? [], totals, hall, year, setYear, playerId, isAdmin, names }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Trophies, titles and milestones</div>
        <h1 className="mb-1.5 mt-1 font-display text-[44px] leading-[0.95] text-astro-text md:text-[56px]">Honours</h1>
        <p className="max-w-[62ch] text-sm text-astro-text-muted">
          Everything the group has won and every milestone it has passed, with the admins&rsquo; write-ups to go with them.{' '}
          <Link to="/awards" className="font-bold text-astro-accent-soft hover:underline">
            See every award on offer
          </Link>
        </p>
      </header>

      <nav className="flex gap-1 border-b border-border" aria-label="Honours views">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            to="/honours"
            search={{ view: v.id, year: yearParam }}
            className={cn(
              '-mb-px border-b-2 px-3.5 pb-2.5 pt-1 text-sm font-bold no-underline transition-colors',
              v.id === view ? 'border-astro-accent text-astro-text' : 'border-transparent text-astro-text-muted hover:text-astro-text',
            )}
            aria-current={v.id === view ? 'page' : undefined}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {view === 'latest' && <LatestView {...props} />}
      {view === 'roll' && <RollView {...props} />}
      {view === 'history' && <HistoryView {...props} />}
    </div>
  )
}
