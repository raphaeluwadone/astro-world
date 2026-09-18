import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/states/EmptyState'
import { OutOfPlayIcon } from '@/components/states/icons'
import type { AvailabilityRow, PlayerSummary } from '../api'

type ReplyStatus = 'in' | 'out' | 'no_reply'

function statusLabel(status: ReplyStatus) {
  if (status === 'in') return 'In'
  if (status === 'out') return 'Out'
  return 'Ghosting'
}

function statusBadgeClass(status: ReplyStatus) {
  if (status === 'in') return 'astro-badge astro-badge--green'
  if (status === 'out') return 'astro-badge astro-badge--red'
  return 'astro-badge astro-badge--neutral'
}

export function WhoRepliedList({
  players,
  availability,
}: {
  players: PlayerSummary[]
  availability: AvailabilityRow[]
}) {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const statusByPlayer = new Map(availability.map((a) => [a.player_id, a.status]))
    return players.map((p) => ({
      player: p,
      status: (statusByPlayer.get(p.id) ?? 'no_reply') as ReplyStatus,
    }))
  }, [players, availability])

  const counts = useMemo(() => {
    const c = { in: 0, out: 0, no_reply: 0 }
    for (const r of rows) c[r.status]++
    return c
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.player.nickname.toLowerCase().includes(q) ||
        r.player.full_name.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">Who&rsquo;s Replied</h2>
        <div className="font-display text-[26px] leading-none text-astro-accent">
          {rows.length - counts.no_reply}
          <span className="text-astro-text-dim">/{rows.length}</span>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players…"
        className="mb-4 h-9 w-full rounded-[10px] border border-border bg-astro-surface-2 px-3 text-xs text-astro-text placeholder:text-astro-text-dim focus:outline-none focus:ring-1 focus:ring-astro-accent"
      />

      <div className="mb-4 flex gap-2">
        <div className="flex-1 rounded-[10px] bg-astro-surface-2 px-3 py-2.5">
          <div className="astro-eyebrow">In</div>
          <div className="font-display text-[28px] leading-[1.05] text-astro-green">{counts.in}</div>
        </div>
        <div className="flex-1 rounded-[10px] bg-astro-surface-2 px-3 py-2.5">
          <div className="astro-eyebrow">Out</div>
          <div className="font-display text-[28px] leading-[1.05] text-astro-red">{counts.out}</div>
        </div>
        <div className="flex-1 rounded-[10px] bg-astro-surface-2 px-3 py-2.5">
          <div className="astro-eyebrow">Ghosting</div>
          <div className="font-display text-[28px] leading-[1.05] text-astro-text-dim">
            {counts.no_reply}
          </div>
        </div>
      </div>

      <div className="flex max-h-[520px] flex-col gap-[7px] overflow-y-auto pr-1">
        {filtered.map(({ player, status }) => (
          <div
            key={player.id}
            className="flex items-center gap-[11px] rounded-[10px] bg-astro-surface-2 px-3 py-[9px]"
          >
            <div
              className="size-[30px] shrink-0 rounded-lg"
              style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-extrabold text-astro-text">
                {player.nickname}
              </div>
              <div className="truncate text-[11px] text-astro-text-dim">{player.full_name}</div>
            </div>
            <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="Loosen the search and we'll find someone." />
        )}
      </div>
    </div>
  )
}
