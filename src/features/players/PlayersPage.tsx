import { useMemo, useState } from 'react'
import type { Database } from '@/types/database'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { PlayerCard } from './components/PlayerCard'
import { usePlayerCards } from './hooks'

type PositionType = Database['public']['Enums']['position_type']

const FILTERS: Array<{ label: string; value: PositionType | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'GK', value: 'GK' },
  { label: 'DEF', value: 'DEF' },
  { label: 'ATT', value: 'ATT' },
  { label: 'UTIL', value: 'UTIL' },
]

const PER_PAGE = 8

export function PlayersPage() {
  const { data: players = [], isLoading, isError, refetch } = usePlayerCards()
  const [filter, setFilter] = useState<PositionType | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (filter === 'ALL') return players
    return players.filter((p) => p.positions.includes(filter))
  }, [players, filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const clampedPage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(clampedPage * PER_PAGE, clampedPage * PER_PAGE + PER_PAGE)

  function selectFilter(value: PositionType | 'ALL') {
    setFilter(value)
    setPage(0)
  }

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Players
      </h1>
      <p className="mb-4.5 text-sm text-astro-text-muted">
        {players.length} in the group. Thirty spots every Sunday.
      </p>

      <div className="mb-4.5 flex flex-wrap items-center gap-[7px]">
        <div className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
          Position
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => selectFilter(f.value)}
            className={
              filter === f.value
                ? 'rounded-[9px] bg-astro-accent px-3.5 py-2 text-xs font-extrabold text-astro-on-accent'
                : 'rounded-[9px] border border-border bg-astro-surface-2 px-3.5 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="Loosen a filter and we'll find someone." />
      ) : (
        <>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 208px), 1fr))' }}
          >
            {pageItems.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>

          <div className="mt-4.5 flex flex-wrap items-center justify-between gap-3.5">
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
      )}
    </div>
  )
}
