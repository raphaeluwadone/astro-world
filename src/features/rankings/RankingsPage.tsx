import { cn } from '@/lib/utils'
import { Scene } from '@/components/states/Scene'
import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Database } from '@/types/database'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { Pager } from '@/components/ui/pager'
import type { RankingRow } from './api'
import { TeamStandingsTable } from './components/TeamStandingsTable'
import { useRankings } from './hooks'
import { cycleLastDay } from '@/features/teams/cycles'
import { RollOfChampions } from '@/features/teams/components/RollOfChampions'
import { useCurrentCycle, useCycleStandings } from '@/features/teams/hooks'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { nextPicks, PICK_COLOURS } from '@/features/compare/metrics'
import { CompareBar, CompareToggle } from '@/features/compare/components/CompareMode'

type PositionType = Database['public']['Enums']['position_type']
type SortKey = 'avg_rating' | 'appearances' | 'goals' | 'assists' | 'motm_count'

const STAT_COLUMNS = [
  { key: 'appearances', label: 'Apps' },
  { key: 'goals', label: 'G' },
  { key: 'assists', label: 'A' },
  { key: 'motm_count', label: 'MOTM' },
] as const

const POSITION_FILTERS: Array<{ label: string; value: PositionType | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'GK', value: 'GK' },
  { label: 'DEF', value: 'DEF' },
  { label: 'ATT', value: 'ATT' },
  { label: 'UTIL', value: 'UTIL' },
]

const SORTS: Array<{ label: string; value: SortKey }> = [
  { label: 'Rating', value: 'avg_rating' },
  { label: 'Apps', value: 'appearances' },
  { label: 'Goals', value: 'goals' },
  { label: 'Assists', value: 'assists' },
  { label: 'MOTM', value: 'motm_count' },
]

const PER_PAGE = 10

function ratingBadgeColor(rating: number | null) {
  if (rating === null) return { background: '#0f1730', color: '#6d7496', border: 'rgba(255,255,255,0.07)' }
  if (rating >= 8) return { background: 'rgba(166,63,255,0.18)', color: '#c589ff', border: 'rgba(166,63,255,0.5)' }
  return { background: '#182448', color: '#eef0f9', border: 'rgba(255,255,255,0.07)' }
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'flex items-center gap-1.5 rounded-[9px] bg-astro-accent px-3.5 py-2 text-xs font-extrabold text-astro-on-accent'
          : 'flex items-center gap-1.5 rounded-[9px] border border-border bg-astro-surface-2 px-3.5 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text'
      }
    >
      {children}
    </button>
  )
}

function PlayerRankings() {
  const { data: rankings = [], isLoading, isError, refetch } = useRankings()
  const [position, setPosition] = useState<PositionType | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>('avg_rating')
  // Phones show one stat column: the one being sorted by, or appearances when sorting by rating.
  const mobileStat = sort === 'avg_rating' ? 'appearances' : sort
  const [page, setPage] = useState(0)
  const [comparing, setComparing] = useState(false)
  const [picks, setPicks] = useState<string[]>([])
  const togglePick = (id: string) => setPicks((p) => nextPicks(p, id))
  function toggleComparing() {
    setComparing((c) => !c)
    setPicks([])
  }

  const filtered = useMemo(() => {
    const base = position === 'ALL' ? rankings : rankings.filter((r) => r.positions.includes(position))
    return [...base].sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1))
  }, [rankings, position, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const clampedPage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(clampedPage * PER_PAGE, clampedPage * PER_PAGE + PER_PAGE)

  function changePosition(value: PositionType | 'ALL') {
    setPosition(value)
    setPage(0)
  }

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4.5">
        <div className="flex flex-wrap items-center gap-[7px]">
          <div className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
            Position
          </div>
          {POSITION_FILTERS.map((f) => (
            <FilterPill key={f.value} active={position === f.value} onClick={() => changePosition(f.value)}>
              {f.label}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-[7px]">
          <div className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
            Sort by
          </div>
          {SORTS.map((s) => (
            <FilterPill key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20.6 3 11h5.4V3.4h7.2V11H21Z" />
              </svg>
              {s.label}
            </FilterPill>
          ))}
        </div>
        <CompareToggle on={comparing} onClick={toggleComparing} />
      </div>

      <div className="astro-card overflow-hidden">
        <div
          className="grid grid-cols-[28px_minmax(0,1fr)_44px_auto] md:grid-cols-[52px_minmax(0,2.2fr)_96px_repeat(4,minmax(0,1fr))_minmax(0,1.6fr)] gap-3 px-4 py-3.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim md:px-5"
          style={{ background: '#182448' }}
        >
          <div>#</div>
          <div>Player</div>
          <div className="hidden text-center md:block">Pos</div>
          {STAT_COLUMNS.map((c) => (
            <div key={c.key} className={cn('text-center', c.key !== mobileStat && 'hidden md:block')}>
              {c.label}
            </div>
          ))}
          <div className="text-right">Rating</div>
        </div>
        {pageItems.length === 0 ? (
          <EmptyState icon={<Scene kind="search" />} title="Nobody fits that." body="Loosen a filter and we'll find someone." />
        ) : (
          pageItems.map((r: RankingRow, i) => {
            const badge = ratingBadgeColor(r.avg_rating)
            const pick = picks.indexOf(r.id)
            const colour = pick >= 0 ? PICK_COLOURS[pick] : undefined
            return (
              <div
                key={r.id}
                {...(comparing && {
                  role: 'button',
                  tabIndex: 0,
                  'aria-pressed': pick >= 0,
                  onClick: () => togglePick(r.id),
                  onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      togglePick(r.id)
                    }
                  },
                })}
                style={colour ? { boxShadow: `inset 0 0 0 2px ${colour}`, background: `${colour}14` } : undefined}
                className={cn('grid grid-cols-[28px_minmax(0,1fr)_44px_auto] md:grid-cols-[52px_minmax(0,2.2fr)_96px_repeat(4,minmax(0,1fr))_minmax(0,1.6fr)] items-center gap-3 border-t border-border px-4 py-[13px] md:px-5', comparing && 'cursor-pointer hover:bg-white/[0.03]')}
              >
                {comparing ? (
                  <div
                    className="grid size-[22px] place-items-center rounded-full border-2"
                    style={colour ? { background: colour, borderColor: colour } : { borderColor: 'rgba(255,255,255,0.22)' }}
                  >
                    {colour && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0f1f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5 10 17.5 19 7" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className="font-display text-xl leading-none text-astro-text md:text-2xl">
                    {clampedPage * PER_PAGE + i + 1}
                  </div>
                )}
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative shrink-0">
                    <PlayerPhoto playerId={r.id} alt="" className="size-[34px] rounded-[9px]" />
                    <BadgeMark playerId={r.id} size={15} showExtra={false} className="absolute -bottom-1.5 -right-1.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-extrabold text-astro-text">{r.nickname}</div>
                    <div className="truncate text-[11px] text-astro-text-dim">
                      <span className="md:hidden">{r.positions.join('/') || '—'} &middot; </span>
                      {r.full_name}
                    </div>
                  </div>
                </div>
                <div className="hidden justify-center md:flex">
                  <div className="whitespace-nowrap rounded-[7px] border border-border bg-astro-surface-sunken px-2 py-1 text-[10.5px] font-extrabold tracking-[0.03em] text-astro-text-muted">
                    {r.positions.join('/') || '—'}
                  </div>
                </div>
                {STAT_COLUMNS.map((c) => (
                  <div key={c.key} className={cn('text-center text-[13px] text-astro-text-muted', c.key !== mobileStat && 'hidden md:block')}>
                    {r[c.key]}
                  </div>
                ))}
                <div className="flex justify-end">
                  <div
                    className="font-display rounded-[9px] border px-3 py-[5px] text-[23px] leading-none"
                    style={{ background: badge.background, color: badge.color, borderColor: badge.border }}
                  >
                    {r.avg_rating ?? '—'}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Pager
        className="mt-4"
        page={clampedPage + 1}
        pageSize={PER_PAGE}
        total={filtered.length}
        onPageChange={(p) => setPage(p - 1)}
        noun="players"
      />

      {comparing && (
        <CompareBar
          picks={picks}
          nameOf={(id) => rankings.find((r) => r.id === id)?.nickname}
          onRemove={togglePick}
          hint="Tap the rows, two to four of them."
        />
      )}
    </>
  )
}

function TeamStandings() {
  const { data: cycle, isLoading: cycleLoading } = useCurrentCycle()
  const { data: standings = [], isLoading, isError, refetch } = useCycleStandings(cycle)
  if (cycleLoading || isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  const ends = cycle && cycleLastDay(cycle.ends_at)
  return (
    <div className="flex flex-col gap-5">
      {cycle && (
        <p className="-mt-2 text-[12.5px] font-bold text-astro-text-dim">
          {cycle.label} race &middot; runs to {ends}. Level on points? Goal difference, goals scored, fewest conceded, then head-to-head.
        </p>
      )}
      <TeamStandingsTable standings={standings} />
      <RollOfChampions />
    </div>
  )
}

export function RankingsPage() {
  const [view, setView] = useState<'players' | 'teams'>('players')

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Rankings
      </h1>
      <p className="mb-5 text-sm text-astro-text-muted">
        {view === 'players'
          ? 'Season average, voted by everyone who had to play with you. Minimum 5 appearances.'
          : "Three points a win, one for a draw. The ballot fills the sides with different people every Sunday, but the points stay with the shirt, and the shirt on top at the end of the year is crowned champion."}
      </p>

      <div className="mb-5 flex gap-2">
        <FilterPill active={view === 'players'} onClick={() => setView('players')}>
          Players
        </FilterPill>
        <FilterPill active={view === 'teams'} onClick={() => setView('teams')}>
          The Six
        </FilterPill>
      </div>

      {view === 'players' ? <PlayerRankings /> : <TeamStandings />}
    </div>
  )
}
