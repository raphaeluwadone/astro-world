import { useState } from 'react'
import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import { Pager } from '@/components/ui/pager'
import type { CompareRow } from '../api'
import type { ViewProps } from '../metrics'

const PAGE_SIZE = 20

export function LeagueList({ picks, rows, config, onToggle }: ViewProps) {
  const [everyone, setEveryone] = useState(false)
  const [page, setPage] = useState(1)
  const byRank = (a: CompareRow, b: CompareRow) => config.rank.get(b) - config.rank.get(a) || a.nickname.localeCompare(b.nickname)
  const qualified = rows.filter((p) => config.games(p) >= config.minGames).sort(byRank)
  const under = rows.filter((p) => config.games(p) < config.minGames).sort(byRank)
  const list = everyone ? [...qualified, ...under] : qualified.slice(0, PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = everyone ? list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : list
  const offset = everyone ? (current - 1) * PAGE_SIZE : 0
  const top = Math.max(0, ...rows.map(config.rank.get)) || 1
  const pickIndex = new Map(picks.map((p, k) => [p.id, k]))
  const { theme } = config

  function toggleEveryone() {
    setEveryone((e) => !e)
    setPage(1)
  }

  return (
    <div className="astro-card p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-2xl leading-none text-astro-text">{config.rank.title}</div>
          <div className="mt-1 text-[12px] text-astro-text-muted">
            {config.rank.note}
            {config.minGames > 1 && ` Ranked from ${config.minGames} games, so one lucky outing can't top the list.`}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[false, true].map((all) => (
            <button
              key={String(all)}
              type="button"
              aria-pressed={everyone === all}
              onClick={() => everyone !== all && toggleEveryone()}
              className="whitespace-nowrap rounded-[8px] border px-2.5 py-1.5 text-[11.5px] font-extrabold"
              style={
                everyone === all
                  ? { background: theme.accent, borderColor: theme.accent, color: '#000' }
                  : { background: '#182448', borderColor: 'rgba(255,255,255,0.09)', color: '#9aa3c4' }
              }
            >
              {all ? `Everyone (${rows.length})` : `Top ${Math.min(PAGE_SIZE, qualified.length)}`}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <NothingHere
          compact
          icon={<Scene kind="bench" />}
          title="Nobody's played enough yet"
          body={`The ranking starts once someone reaches ${config.minGames} games.`}
          action={
            rows.length > 0 && (
              <button type="button" onClick={toggleEveryone} className="text-[12px] font-extrabold" style={{ color: theme.soft }}>
                Show everyone anyway
              </button>
            )
          }
        />
      ) : (
        <div className="flex flex-col">
          {shown.map((p, n) => {
            const index = offset + n
            const ranked = index < qualified.length
            const k = pickIndex.get(p.id)
            const on = k !== undefined
            const v = config.rank.get(p)
            return (
              <div key={p.id}>
                {everyone && index === qualified.length && (
                  <div className="mb-1 mt-3 border-t border-border px-2 pt-3 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                    Under {config.minGames} games, not ranked
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  aria-pressed={on}
                  className="grid w-full grid-cols-[26px_minmax(70px,120px)_minmax(0,1fr)_44px] items-center gap-3 rounded-[9px] px-2 py-[7px] text-left hover:bg-white/[0.03]"
                  style={{ background: on ? `rgba(${theme.rgb},0.08)` : undefined, opacity: ranked ? 1 : 0.7 }}
                >
                  <div className="text-[12px] font-bold text-astro-text-dim">{ranked ? index + 1 : '·'}</div>
                  <div className="truncate text-[13px]" style={{ color: on ? '#eef0f9' : '#9aa3c4', fontWeight: on ? 800 : 600 }}>
                    {p.nickname}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#182448]">
                    <div
                      className="h-full origin-left rounded-full"
                      style={{
                        width: `${(v / top) * 100}%`,
                        background: on ? theme.colours[k] : '#3c4570',
                        animation: `cm-bar 0.6s cubic-bezier(.2,.8,.2,1) ${Math.min(n, 12) * 0.03}s backwards`,
                      }}
                    />
                  </div>
                  <div className="font-display text-right text-lg leading-none text-astro-text">{config.rank.fmt(v)}</div>
                </button>
              </div>
            )
          })}
          {everyone && <Pager className="mt-4" page={current} pageSize={PAGE_SIZE} total={list.length} onPageChange={setPage} noun="players" accent={theme.accent} />}
        </div>
      )}
    </div>
  )
}
