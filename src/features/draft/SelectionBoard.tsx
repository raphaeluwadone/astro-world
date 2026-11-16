import { cn } from 'cn'
import { useMemo, useState } from 'react'
import { withConfirm } from '@/components/dialogs/confirm'
import { onTheClock, poolLeft, roundNote, sides, totalPicks, type DraftState } from './turn'

/** The selection as everyone sees it: who is on the clock, the sides filling up, and the names still to go. */
export function SelectionBoard({
  state,
  nameOf,
  meId,
  isAdmin,
  onPick,
  busy,
  tone = 'default',
}: {
  state: DraftState
  nameOf: (playerId: string) => string
  meId: string | null
  isAdmin: boolean
  onPick: (playerId: string) => void
  busy?: boolean
  tone?: 'default' | 'admin'
}) {
  const [query, setQuery] = useState('')
  const clock = onTheClock(state)
  const left = poolLeft(state)
  const all = sides(state)
  const current = clock ? all.find((s) => s.slot === clock.slot) : undefined
  const myTurn = !!clock && meId === clock.captainId
  const canPick = !!clock && (isAdmin || myTurn)
  const q = query.trim().toLowerCase()

  const shown = useMemo(
    () =>
      left
        .map((id) => ({ id, name: nameOf(id) }))
        .filter((p) => !q || p.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [left, nameOf, q],
  )

  const choose = (id: string) => {
    if (!clock || !current) return
    const who = nameOf(id)
    withConfirm(
      {
        tone,
        eyebrow: 'Selection',
        title: `Pick ${who} for ${current.name}?`,
        body: myTurn ? 'They go straight onto your side and the next captain is up.' : `${nameOf(clock.captainId)} is on the clock. This picks for them.`,
        confirmLabel: `Pick ${who}`,
      },
      () => onPick(id),
    )
  }

  const pool = (
    <section className={cn('flex flex-col gap-3', canPick ? 'order-1' : 'order-2')}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="astro-eyebrow">Still available &middot; {left.length}</h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a name"
          aria-label="Find a name"
          className="ml-auto min-h-9 min-w-0 flex-[1_1_160px] rounded-[10px] border border-white/[0.1] bg-astro-surface-2 px-3 text-[13px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-accent/60 focus:outline-none sm:max-w-[220px]"
        />
      </div>
      <ul className="flex flex-wrap gap-2">
        {shown.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              disabled={!canPick || busy}
              onClick={() => choose(p.id)}
              className={cn(
                'min-h-10 rounded-full border px-3.5 text-[13px] font-bold transition-colors',
                canPick ? 'border-white/[0.16] text-astro-text hover:border-astro-accent hover:bg-astro-accent/[0.12]' : 'cursor-default border-white/[0.08] text-astro-text-muted',
                busy && 'opacity-60',
              )}
            >
              {p.name}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="text-[13px] text-astro-text-dim">{q ? 'No one left by that name.' : 'Everyone has been picked.'}</li>}
      </ul>
    </section>
  )

  const board = (
    <section className={cn('grid grid-cols-2 gap-2.5 md:grid-cols-3', canPick ? 'order-2' : 'order-1')} aria-label="The sides">
      {all.map((s) => {
        const active = clock?.slot === s.slot
        return (
          <div
            key={s.slot}
            className="rounded-[14px] border bg-astro-surface p-3 transition-shadow"
            style={{ borderColor: active ? s.colour : 'rgba(255,255,255,0.08)', boxShadow: active ? `0 0 0 1px ${s.colour}, 0 0 24px ${s.colour}40` : undefined }}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <span className={cn('size-2.5 shrink-0 rounded-full', active && 'animate-pulse')} style={{ background: s.colour }} aria-hidden />
              <span className="font-display text-[24px] leading-none text-astro-text">{s.name}</span>
              <span className="ml-auto text-[12px] font-bold text-astro-text-dim">{s.picks.length + 1}</span>
            </div>
            <ul className="flex flex-col gap-1">
              <li className="flex items-center gap-1.5 text-[13px] font-extrabold text-astro-text">
                <span className="rounded-[4px] px-1 text-[10px] font-extrabold" style={{ background: `${s.colour}33`, color: s.colour }} title="Captain">
                  C
                </span>
                <span className="min-w-0 truncate">{nameOf(s.captainId)}</span>
              </li>
              {s.picks.map((p) => (
                <li key={p.pick_no} className="flex items-center gap-1.5 text-[13px] font-semibold text-astro-text-muted">
                  <span className="w-5 shrink-0 text-right text-[10.5px] font-bold text-astro-text-dim">{p.pick_no}</span>
                  <span className="min-w-0 truncate">{nameOf(p.player_id)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <span className="astro-eyebrow">Selection</span>
          <span className="ml-auto text-[12px] font-bold text-astro-text-dim">
            {state.picks.length} of {totalPicks(state)} picked
          </span>
        </div>
        {clock && current ? (
          <>
            <h2 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[48px]">
              {myTurn ? 'Your pick' : <><span style={{ color: current.colour }}>{current.name}</span> to pick</>}
            </h2>
            <p className="mt-1.5 text-[13px] text-astro-text-muted">
              {myTurn ? `You're on the clock for ${current.name}. Tap a name below.` : `${nameOf(clock.captainId)} is picking for ${current.name}.`} Pick {clock.pickNo}. {roundNote(clock.pickNo, state.session!.team_count)}.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[48px]">All picked</h2>
            <p className="mt-1.5 text-[13px] text-astro-text-muted">Waiting for the admins to publish the teams.</p>
          </>
        )}
      </header>
      <div className="flex flex-col gap-5">
        {pool}
        {board}
      </div>
    </div>
  )
}
