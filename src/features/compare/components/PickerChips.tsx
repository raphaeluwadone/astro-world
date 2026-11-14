import { useState } from 'react'
import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import { Pager } from '@/components/ui/pager'
import type { CompareRow } from '../api'
import { MAX_PICKS, type Theme } from '../metrics'

const PAGE_SIZE = 24

export function PickerChips({
  rows,
  picks,
  theme,
  onToggle,
}: {
  rows: CompareRow[]
  picks: CompareRow[]
  theme: Theme
  onToggle: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const q = query.trim().toLowerCase()
  const matches = q ? rows.filter((p) => p.nickname.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q)) : rows
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const pickIndex = new Map(picks.map((p, k) => [p.id, k]))

  return (
    <div className="astro-card mb-5 p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="astro-eyebrow">Shortlist</div>
        <div className="text-[11.5px] font-bold text-astro-text-dim">
          {picks.length} of {MAX_PICKS} · tap to add or drop
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {picks.map((p, k) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            disabled={picks.length === 1}
            className="whitespace-nowrap rounded-lg border px-[11px] py-[7px] text-[11.5px] font-extrabold text-black"
            style={{ background: theme.colours[k], borderColor: theme.colours[k] }}
          >
            {p.nickname}
            {picks.length > 1 && ' ×'}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setPage(1)
        }}
        placeholder="Find a player"
        aria-label="Find a player to compare"
        className="mb-3 w-full rounded-[10px] border border-white/[0.09] bg-astro-surface-2 px-3.5 py-2.5 text-[13px] font-semibold text-astro-text placeholder:text-astro-text-dim focus:outline-none"
        style={{ borderColor: q ? `rgba(${theme.rgb},0.5)` : undefined }}
      />

      {matches.length === 0 ? (
        <NothingHere compact icon={<Scene kind="search" />} title="Nobody by that name" body={`No player matches “${query.trim()}”.`} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((p) => {
              const k = pickIndex.get(p.id)
              const on = k !== undefined
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p.id)}
                  aria-pressed={on}
                  className="whitespace-nowrap rounded-lg border px-[11px] py-[7px] text-[11.5px] transition-colors"
                  style={
                    on
                      ? { background: theme.colours[k], borderColor: theme.colours[k], color: '#000', fontWeight: 800 }
                      : { background: '#182448', borderColor: 'rgba(255,255,255,0.09)', color: '#9aa3c4', fontWeight: 600 }
                  }
                >
                  {p.nickname}
                </button>
              )
            })}
          </div>
          {pages > 1 && <Pager className="mt-3" page={current} pageSize={PAGE_SIZE} total={matches.length} onPageChange={setPage} noun="players" accent={theme.accent} />}
        </>
      )}
    </div>
  )
}
