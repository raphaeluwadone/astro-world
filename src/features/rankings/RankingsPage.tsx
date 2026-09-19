import { useMemo, useState, type ReactNode } from 'react'
import type { Database } from '@/types/database'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import type { RankingRow } from './api'
import { TeamStandingsTable } from './components/TeamStandingsTable'
import { useRankings, useSeasonTeamStandings } from './hooks'

type PositionType = Database['public']['Enums']['position_type']
type SortKey = 'avg_rating' | 'appearances' | 'goals' | 'assists' | 'motm_count'

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
  const [page, setPage] = useState(0)

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
      </div>

      <div className="astro-card overflow-hidden">
        <div
          className="grid gap-3 px-5 py-3.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim"
          style={{ gridTemplateColumns: '52px minmax(0,2.2fr) 96px repeat(4,minmax(0,1fr)) minmax(0,1.6fr)', background: '#182448' }}
        >
          <div>#</div>
          <div>Player</div>
          <div className="text-center">Pos</div>
          <div className="text-center">Apps</div>
          <div className="text-center">G</div>
          <div className="text-center">A</div>
          <div className="text-center">MOTM</div>
          <div className="text-right">Rating</div>
        </div>
        {pageItems.length === 0 ? (
          <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="Loosen a filter and we'll find someone." />
        ) : (
          pageItems.map((r: RankingRow, i) => {
            const badge = ratingBadgeColor(r.avg_rating)
            return (
              <div
                key={r.id}
                className="grid items-center gap-3 border-t border-border px-5 py-[13px]"
                style={{ gridTemplateColumns: '52px minmax(0,2.2fr) 96px repeat(4,minmax(0,1fr)) minmax(0,1.6fr)' }}
              >
                <div className="font-display text-2xl leading-none text-astro-text">
                  {clampedPage * PER_PAGE + i + 1}
                </div>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="size-[34px] shrink-0 rounded-[9px]"
                    style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-extrabold text-astro-text">
                      {r.nickname}
                    </div>
                    <div className="truncate text-[11px] text-astro-text-dim">{r.full_name}</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="whitespace-nowrap rounded-[7px] border border-border bg-astro-surface-sunken px-2 py-1 text-[10.5px] font-extrabold tracking-[0.03em] text-astro-text-muted">
                    {r.positions.join('/') || '—'}
                  </div>
                </div>
                <div className="text-center text-[13px] text-astro-text-muted">{r.appearances}</div>
                <div className="text-center text-[13px] text-astro-text-muted">{r.goals}</div>
                <div className="text-center text-[13px] text-astro-text-muted">{r.assists}</div>
                <div className="text-center text-[13px] text-astro-text-muted">{r.motm_count}</div>
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3.5">
        <div className="text-[12.5px] text-astro-text-dim">
          {filtered.length} &middot; Page {clampedPage + 1} of {pageCount}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={clampedPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-astro-surface-2 text-astro-text-muted disabled:opacity-40"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
            </svg>
          </button>
          <button
            type="button"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-astro-surface-2 text-astro-text-muted disabled:opacity-40"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.4 3.6 16.8 12l-8.4 8.4Z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}

function TeamStandings() {
  const { data: standings = [], isLoading, isError, refetch } = useSeasonTeamStandings()
  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  return <TeamStandingsTable standings={standings} />
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
          : "Three points a win, one for a draw. The sides run all season even though the ballot fills them with different people every Sunday, you play for whoever you're drawn into, and the points stay with the shirt."}
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
