import { cn } from 'cn'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/components/dialogs/AdminConfirmDialog'
import { withConfirm } from '@/components/dialogs/confirm'
import { usePublishTeamDraw } from '@/features/matchday/draw/hooks'
import { TEAM_ID } from '@/lib/teamId'
import { useTileDrag } from './useTileDrag'

type Player = { id: string; nickname: string; full_name?: string }

const storageKey = (matchdayId: string) => `astro:pick-teams:${matchdayId}`

function loadPicks(matchdayId: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(matchdayId)) ?? '{}')
  } catch {
    return {}
  }
}

/** Hand-picked sides: tap players into the chosen team, or drag tiles between teams. */
export function PickTeams({ matchdayId, confirmed }: { matchdayId: string; confirmed: Player[] }) {
  const publish = usePublishTeamDraw(matchdayId)
  const [teamCount, setTeamCount] = useState(() => Math.min(TEAM_ID.length, Math.max(2, Math.floor(confirmed.length / 6))))
  const [picks, setPicks] = useState<Record<string, number>>(() => loadPicks(matchdayId))
  const [active, setActive] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(matchdayId), JSON.stringify(picks))
    } catch {
      // Picks just won't survive a reload.
    }
  }, [matchdayId, picks])

  const teamOf = (id: string) => {
    const t = picks[id]
    return t !== undefined && t < teamCount ? t : undefined
  }
  const teams = Array.from({ length: teamCount }, (_, i) => confirmed.filter((p) => teamOf(p.id) === i))
  const pool = confirmed.filter((p) => teamOf(p.id) === undefined)
  const target = confirmed.length / teamCount
  const uneven = teams.some((t) => t.length !== teams[0].length)
  const placed = confirmed.length - pool.length
  const q = query.trim().toLowerCase()
  const matches = (p: Player) => !q || p.nickname.toLowerCase().includes(q) || (p.full_name ?? '').toLowerCase().includes(q)
  const poolShown = pool.filter(matches)
  // Searching also finds players already on a side, so one can be moved without hunting through the sides.
  const placedShown = q ? confirmed.filter((p) => teamOf(p.id) !== undefined && matches(p)) : []
  const canPublish = pool.length === 0 && teams.every((t) => t.length > 0)

  const place = (id: string, team: number | undefined) =>
    setPicks((prev) => {
      const next = { ...prev }
      if (team === undefined) delete next[id]
      else next[id] = team
      return next
    })
  const { drag, tileProps } = useTileDrag((id, target) => typeof target === 'number' ? place(id, target) : place(id, undefined))
  const dragFrom = drag ? teamOf(drag.id) ?? 'pool' : null
  const overTarget = drag && drag.over !== null && drag.over !== 'cancel' && drag.over !== dragFrom ? drag.over : null
  const ghostHint = !drag ? '' : overTarget === null ? 'Let go to cancel' : overTarget === 'pool' ? 'Unpick' : `Into ${TEAM_ID[overTarget].name}`

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[12.5px] font-bold text-astro-text-muted">Sides</span>
        {[2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setTeamCount(n)
              if (active >= n) setActive(0)
            }}
            className={cn(
              'min-h-8 min-w-8 rounded-[8px] text-[13px] font-extrabold',
              teamCount === n ? 'bg-astro-cyan/[0.16] text-astro-text' : 'border border-white/[0.09] text-astro-text-muted',
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((members, i) => {
          const t = TEAM_ID[i]
          const selected = active === i
          const over = overTarget === i
          return (
            <div
              key={t.name}
              data-drop={i}
              className={cn('rounded-[12px] border p-2.5 transition-[background-color,box-shadow,transform] duration-100', selected || over ? 'bg-white/[0.04]' : 'border-white/[0.08]', over && 'scale-[1.02]')}
              style={over ? { borderColor: t.colour, background: `${t.colour}24`, boxShadow: `0 0 0 2px ${t.colour}` } : selected ? { borderColor: t.colour } : undefined}
            >
              <button type="button" onClick={() => setActive(i)} aria-pressed={selected} className="mb-1.5 flex w-full items-center gap-1.5 text-left">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: t.colour }} />
                <span className="flex-1 text-[13px] font-extrabold text-astro-text">{t.name}</span>
                <span className={cn('text-[12px] font-bold', members.length > target ? 'text-astro-amber' : 'text-astro-text-dim')}>{members.length}</span>
              </button>
              <ul className="flex flex-col gap-1">
                {members.map((p) => (
                  <li key={p.id} className={cn('flex items-center rounded-[7px] bg-white/[0.05]', drag?.id === p.id && 'opacity-30 outline-1 outline-dashed outline-white/40')}>
                    <div
                      {...tileProps(p.id, p.nickname, () => {})}
                      title="Drag to another side"
                      className="min-w-0 flex-1 cursor-grab touch-manipulation select-none truncate px-2 py-1 text-[12px] font-bold text-astro-text [-webkit-touch-callout:none]"
                    >
                      {p.nickname}
                    </div>
                    <button
                      type="button"
                      onClick={() => place(p.id, undefined)}
                      aria-label={`Unpick ${p.nickname}`}
                      className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[14px] leading-none text-astro-text-dim hover:bg-astro-red/[0.15] hover:text-astro-red"
                    >
                      &times;
                    </button>
                  </li>
                ))}
                {over && drag && (
                  <li className="truncate rounded-[7px] border border-dashed px-2 py-1 text-[12px] font-bold text-astro-text" style={{ borderColor: t.colour }}>
                    {drag.label}
                  </li>
                )}
                {members.length === 0 && !over && <li className="text-[11.5px] text-astro-text-dim">{selected ? 'Tap players below' : 'Tap to pick for this side'}</li>}
              </ul>
            </div>
          )
        })}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !poolShown[0]) return
          e.preventDefault()
          place(poolShown[0].id, active)
          setQuery('')
        }}
        placeholder={`Search players, Enter adds the first to ${TEAM_ID[active].name}`}
        aria-label="Search players"
        className="mb-3 min-h-10 w-full rounded-[10px] border border-white/[0.1] bg-astro-admin-card px-3 text-[13.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none"
      />

      <div data-drop="pool" className={cn('-mx-1.5 mb-4 rounded-[12px] border border-transparent p-1.5 transition-colors duration-100', overTarget === 'pool' && 'border-astro-cyan/70 bg-astro-cyan/[0.08]')}>
        <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">
          {q
            ? `${poolShown.length} of ${pool.length} not picked match, tap to add to ${TEAM_ID[active].name}`
            : pool.length
              ? `Not picked · ${pool.length}, tap to add to ${TEAM_ID[active].name} or drag onto a side`
              : 'Everyone is on a side'}
        </div>
        <ul className="flex min-h-8 flex-wrap gap-1.5">
          {poolShown.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                {...tileProps(p.id, p.nickname, () => place(p.id, active))}
                className={cn(
                  'min-h-8 cursor-grab touch-manipulation select-none rounded-full border border-white/[0.12] px-2.5 text-[12px] font-bold text-astro-text-muted hover:text-astro-text [-webkit-touch-callout:none]',
                  drag?.id === p.id && 'opacity-30',
                )}
              >
                {p.nickname}
              </button>
            </li>
          ))}
          {overTarget === 'pool' && drag && (
            <li className="min-h-8 rounded-full border border-dashed border-astro-cyan/70 px-2.5 py-1.5 text-[12px] font-bold text-astro-text">{drag.label}</li>
          )}
          {q && poolShown.length === 0 && <li className="text-[12px] text-astro-text-dim">Nobody left to pick matches &ldquo;{query.trim()}&rdquo;.</li>}
        </ul>
        {placedShown.length > 0 && (
          <>
            <div className="mb-1.5 mt-3 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">Already on a side, tap to move to {TEAM_ID[active].name}</div>
            <ul className="flex flex-wrap gap-1.5">
              {placedShown.map((p) => {
                const t = TEAM_ID[teamOf(p.id)!]
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => place(p.id, active)}
                      className="flex min-h-8 items-center gap-1.5 rounded-full border border-white/[0.12] px-2.5 text-[12px] font-bold text-astro-text-muted hover:text-astro-text"
                    >
                      <span className="size-2 rounded-full" style={{ background: t.colour }} />
                      {p.nickname}
                      <span className="text-astro-text-dim">{t.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      {drag && (
        <>
          <div
            className={cn(
              'pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-[130%] flex-col items-center rounded-[12px] px-3 py-1.5 shadow-lg',
              overTarget === null ? 'bg-astro-surface-2 text-astro-text-muted ring-1 ring-white/20' : 'bg-astro-cyan text-[#04121d]',
            )}
            style={{ left: drag.x, top: drag.y }}
          >
            <span className="text-[12.5px] font-extrabold">{drag.label}</span>
            <span className="text-[10.5px] font-bold opacity-80">{ghostHint}</span>
          </div>
          <div
            data-drop="cancel"
            className={cn(
              'fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-center border-t text-[14px] font-extrabold backdrop-blur',
              drag.over === 'cancel' ? 'border-astro-red bg-astro-red/[0.25] text-astro-text' : 'border-white/[0.12] bg-black/60 text-astro-text-muted',
            )}
          >
            &times;&nbsp; Drop here to cancel
          </div>
        </>
      )}

      {uneven && pool.length === 0 && <p className="mb-2 text-[12px] text-astro-amber">The sides aren&rsquo;t the same size.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={placed === 0}
          onClick={() =>
            withConfirm({ tone: 'admin', eyebrow: 'Pick teams', title: `Clear all ${placed} picks?`, body: 'Every player goes back to Not picked.', confirmLabel: 'Clear picks' }, () => setPicks({}))
          }
          className={cn(
            'min-h-12 rounded-[12px] border text-[14px] font-extrabold transition-[background-color,border-color,color,transform] duration-100',
            placed === 0
              ? 'cursor-not-allowed border-white/[0.06] text-astro-text-dim'
              : 'border-astro-red/50 text-astro-red hover:border-astro-red hover:bg-astro-red/[0.12] active:scale-[0.98] active:bg-astro-red/[0.2]',
          )}
        >
          {placed === 0 ? 'Nothing to clear' : `Clear ${placed} ${placed === 1 ? 'pick' : 'picks'}`}
        </button>
        <button
          type="button"
          disabled={!canPublish}
          onClick={() => setConfirming(true)}
          className="min-h-12 rounded-[12px] bg-astro-cyan text-[14px] font-extrabold text-[#04121d] disabled:opacity-40"
        >
          Publish teams
        </button>
      </div>
      <AdminConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        eyebrow="Pick teams"
        title="Publish these teams?"
        body="Posts the sides to the feed and tells every player their team. You can still swap players at check-in."
        confirmLabel="Publish"
        isPending={publish.isPending}
        onConfirm={() =>
          publish.mutate(
            teams.map((t) => t.map((p) => p.id)),
            {
              onSuccess: () => {
                setConfirming(false)
                try {
                  localStorage.removeItem(storageKey(matchdayId))
                } catch {
                  // Nothing to clean up.
                }
                toast.success('Teams are out')
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : 'Couldn’t publish the teams.'),
            },
          )
        }
      />
    </div>
  )
}
