import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/components/dialogs/AdminConfirmDialog'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import type { PlayerSummary, TeamWithMembers } from '@/features/matchday/api'
import { useDrawnTeams, useNextMatchday } from '@/features/matchday/hooks'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import { RichEditor } from '@/components/editor/RichEditor'
import { DrawPreviewCard } from '@/features/matchday/draw/components/DrawPreviewCard'
import { DrawRulesForm, RULE_COPY, RULE_ORDER } from '@/features/matchday/draw/components/DrawRulesForm'
import { useDrawRules, usePreviewTeamDraw, usePublishTeamDraw, useSaveDrawRules } from '@/features/matchday/draw/hooks'
import type { DrawRules } from '@/features/matchday/draw/rules'
import { useConfirmedPlayers } from '@/features/matchday/draw/useConfirmedPlayers'
import * as api from './api'
import { countdown, fmtMinute, useNow } from './clock'
import { rotation, shuffled } from './rotation'
import { DayTable } from './DayTable'
import { usePitch, usePitchAction } from './hooks'

type Tab = 'checkin' | 'games'
const LENGTHS = [6, 8, 10, 12, 15]

const fail = (what: string) => () => toast.error(`Couldn’t ${what}. Check the signal and try again.`)

// Keeps the phone screen on while a game is running.
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock.request('screen').then((l) => (lock = l), () => {})
    return () => void lock?.release().catch(() => {})
  }, [active])
}

function TeamDot({ team, className }: { team: TeamWithMembers; className?: string }) {
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: team.colour }} aria-hidden />
}

/* ---------------- Check-in ---------------- */

function SwapIn({
  team,
  out,
  onTeams,
  act,
  matchdayId,
  onDone,
}: {
  team: TeamWithMembers
  out: PlayerSummary
  onTeams: Set<string>
  act: ReturnType<typeof usePitchAction>
  matchdayId: string
  onDone: () => void
}) {
  const qc = useQueryClient()
  const { data: players = [] } = useQuery({ queryKey: ['pitch-swap-candidates'], queryFn: api.fetchSwapCandidates })
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const free = players.filter((p) => !onTeams.has(p.id))
  const matches = free.filter((p) => !q || p.nickname.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q)).slice(0, 8)
  const taken = players.some((p) => p.nickname.toLowerCase() === q)

  const swap = (inId: string, name: string) =>
    act.mutate((by) => api.swapPlayer(matchdayId, team.id, out.id, inId, by), {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ['drawn-teams', matchdayId] })
        toast.success(`${name} in for ${out.nickname}.`)
        onDone()
      },
      onError: fail('make that swap'),
    })
  const walkIn = () =>
    act.mutate(() => api.addWalkIn(query), {
      onSuccess: (id) => {
        void qc.invalidateQueries({ queryKey: ['pitch-swap-candidates'] })
        swap(id as string, query.trim())
      },
      onError: (e) => toast.error(/duplicate|unique/i.test(String((e as { message?: string }).message)) ? 'Someone already has that nickname. Pick them from the list.' : 'Couldn’t add them. Try again.'),
    })

  return (
    <div className="mt-3 rounded-[10px] border border-astro-cyan/40 bg-astro-admin-bg p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-extrabold text-astro-text">Who&rsquo;s in for {out.nickname}?</span>
        <button type="button" onClick={onDone} className="ml-auto text-xs font-bold text-astro-text-dim hover:text-astro-text">
          Cancel
        </button>
      </div>
      <input
        autoFocus
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, or type a new name"
        aria-label="Replacement player"
        maxLength={30}
        className="mb-2 min-h-10 w-full rounded-[9px] border border-white/[0.1] bg-astro-admin-card px-3 text-[13.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-cyan/60 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        {matches.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={act.isPending}
            onClick={() => swap(p.id, p.nickname)}
            className="flex min-h-11 items-center gap-2 rounded-[10px] border border-white/[0.1] px-2.5 text-left hover:border-astro-cyan/60"
          >
            <PlayerPhoto playerId={p.id} alt="" className="size-7 shrink-0 rounded-[7px]" />
            <span className="truncate text-[13px] font-bold text-astro-text">{p.nickname}</span>
          </button>
        ))}
        {q && !taken && (
          <button
            type="button"
            disabled={act.isPending}
            onClick={walkIn}
            className="col-span-2 min-h-11 rounded-[10px] border border-dashed border-astro-cyan/50 px-2.5 text-left text-[13px] font-bold text-astro-cyan"
          >
            + Add &ldquo;{query.trim()}&rdquo; as a walk-in
          </button>
        )}
      </div>
      {q && matches.length === 0 && taken && <p className="mt-1 text-[12px] text-astro-text-dim">They&rsquo;re already on a team today.</p>}
    </div>
  )
}

function CheckIn({ teams, checkedIn, act, matchdayId }: { teams: TeamWithMembers[]; checkedIn: Set<string>; act: ReturnType<typeof usePitchAction>; matchdayId: string }) {
  const [swapping, setSwapping] = useState<{ teamId: string; outId: string | null } | null>(null)
  const onTeams = new Set(teams.flatMap((t) => t.members.map((m) => m.id)))
  const total = teams.reduce((n, t) => n + t.members.length, 0)
  const here = teams.reduce((n, t) => n + t.members.filter((m) => checkedIn.has(m.id)).length, 0)
  const set = (ids: string[], on: boolean) => act.mutate((by) => api.setCheckins(matchdayId, ids, on, by), { onError: fail('save that check-in') })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[34px] leading-none text-astro-text">
          {here}/{total}
        </span>
        <span className="text-[13px] text-astro-text-muted">here. Tap a player when they arrive.</span>
      </div>
      {teams.map((t) => {
        const ids = t.members.map((m) => m.id)
        const all = ids.every((id) => checkedIn.has(id))
        return (
          <section key={t.id} className="rounded-[14px] border bg-astro-admin-card p-3.5" style={{ borderColor: `color-mix(in srgb, ${t.colour} 40%, transparent)` }}>
            <div className="mb-2.5 flex items-center gap-2">
              <TeamDot team={t} />
              <span className="text-[14px] font-extrabold text-astro-text">{t.greek_name}</span>
              <span className="text-xs text-astro-text-dim">
                {ids.filter((id) => checkedIn.has(id)).length}/{ids.length}
              </span>
              {swapping?.teamId === t.id ? (
                !swapping.outId && (
                  <>
                    <span className="ml-auto text-xs font-bold text-astro-amber">Tap who&rsquo;s out</span>
                    <button type="button" onClick={() => setSwapping(null)} className="text-xs font-bold text-astro-text-dim hover:text-astro-text">
                      Cancel
                    </button>
                  </>
                )
              ) : (
                <>
                  <button type="button" onClick={() => setSwapping({ teamId: t.id, outId: null })} className="ml-auto text-xs font-bold text-astro-text-muted hover:text-astro-text">
                    Swap
                  </button>
                  <button type="button" onClick={() => set(ids, !all)} className="text-xs font-bold text-astro-cyan hover:underline">
                    {all ? 'Clear' : 'All here'}
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {t.members.map((m) => {
                const on = checkedIn.has(m.id)
                const picking = swapping?.teamId === t.id && !swapping.outId
                const out = swapping?.teamId === t.id && swapping.outId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={picking ? undefined : on}
                    onClick={() => (picking ? setSwapping({ teamId: t.id, outId: m.id }) : set([m.id], !on))}
                    className={cn(
                      'flex min-h-12 items-center gap-2 rounded-[10px] border px-2.5 text-left transition-colors',
                      out
                        ? 'border-astro-red/70 bg-astro-red/[0.12] line-through'
                        : picking
                          ? 'border-dashed border-astro-amber/60 bg-astro-admin-bg'
                          : on
                            ? 'border-astro-green/60 bg-astro-green/[0.12]'
                            : 'border-white/[0.08] bg-astro-admin-bg hover:border-white/20',
                    )}
                  >
                    <PlayerPhoto playerId={m.id} alt="" className="size-7 shrink-0 rounded-[7px]" />
                    <span className={cn('min-w-0 flex-1 truncate text-[13px] font-bold', on ? 'text-astro-text' : 'text-astro-text-muted')}>{m.nickname}</span>
                    {on && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.2" aria-hidden>
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            {swapping?.teamId === t.id && swapping.outId && (
              <SwapIn
                key={swapping.outId}
                team={t}
                out={t.members.find((m) => m.id === swapping.outId)!}
                onTeams={onTeams}
                act={act}
                matchdayId={matchdayId}
                onDone={() => setSwapping(null)}
              />
            )}
          </section>
        )
      })}
    </div>
  )
}

/* ---------------- Goal picker ---------------- */

function PlayerGrid({ players, onPick, extra }: { players: PlayerSummary[]; onPick: (id: string | null) => void; extra: { label: string; value: null } }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {players.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPick(p.id)}
          className="flex min-h-12 items-center gap-2 rounded-[10px] border border-white/[0.1] bg-astro-admin-bg px-2.5 text-left hover:border-astro-cyan/60 active:bg-astro-cyan/10"
        >
          <PlayerPhoto playerId={p.id} alt="" className="size-7 shrink-0 rounded-[7px]" />
          <span className="truncate text-[13.5px] font-bold text-astro-text">{p.nickname}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPick(extra.value)}
        className="min-h-12 rounded-[10px] border border-dashed border-white/[0.16] px-2.5 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
      >
        {extra.label}
      </button>
    </div>
  )
}

type Picking =
  | { teamId: string; step: 'scorer' }
  | { teamId: string; step: 'fix-scorer'; goalId: string; assistId: string | null }
  | { teamId: string; step: 'assist'; goalId: string; scorerId: string | null; assistId: string | null }

function GoalPicker({
  team,
  players,
  picking,
  onScorer,
  onAssist,
  onClose,
}: {
  team: TeamWithMembers
  players: PlayerSummary[]
  picking: Picking
  onScorer: (id: string | null) => void
  onAssist: (id: string | null) => void
  onClose: () => void
}) {
  const assist = picking.step === 'assist'
  return (
    <div className="rounded-[14px] border-2 bg-astro-admin-card p-3.5" style={{ borderColor: team.colour }}>
      <div className="mb-3 flex items-center gap-2">
        <TeamDot team={team} />
        <span className="text-[14px] font-extrabold text-astro-text">
          {assist ? 'Who set it up?' : picking.step === 'fix-scorer' ? `Who scored this ${team.greek_name} goal?` : `Goal for ${team.greek_name}. Who scored?`}
        </span>
        <button type="button" onClick={onClose} className="ml-auto text-xs font-bold text-astro-text-dim hover:text-astro-text">
          {assist && !picking.assistId ? 'Skip' : 'Cancel'}
        </button>
      </div>
      {assist ? (
        <PlayerGrid players={players.filter((p) => p.id !== picking.scorerId)} onPick={onAssist} extra={{ label: 'No assist', value: null }} />
      ) : (
        <PlayerGrid players={players} onPick={onScorer} extra={{ label: 'Not sure yet', value: null }} />
      )}
    </div>
  )
}

/* ---------------- Live game ---------------- */

function GoalTime({ goal, lengthMin, act }: { goal: api.PitchGoal; lengthMin: number; act: ReturnType<typeof usePitchAction> }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const label = fmtMinute(goal.minute, lengthMin)
  const save = (minute: number | null) => {
    act.mutate(() => api.updateGoal(goal.id, { minute }), { onError: fail('change the time') })
    setEditing(false)
  }

  if (!editing)
    return (
      <button
        type="button"
        aria-label={label ? `Goal time ${label}, edit` : 'Add goal time'}
        onClick={() => {
          setValue(goal.minute?.toString() ?? '')
          setEditing(true)
        }}
        className={cn(
          'min-h-8 w-12 shrink-0 rounded-[7px] border border-transparent text-right text-xs font-extrabold hover:border-white/[0.14]',
          goal.minute != null && goal.minute > lengthMin ? 'text-astro-red' : label ? 'text-astro-text-dim' : 'text-astro-text-dim/60',
        )}
      >
        {label ?? '+ time'}
      </button>
    )

  const n = Number(value)
  const valid = value !== '' && Number.isInteger(n) && n >= 1 && n <= 99
  return (
    <form
      className="flex shrink-0 items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) save(n)
      }}
    >
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={99}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        aria-label="Minute"
        className="h-8 w-12 rounded-[7px] border border-astro-cyan/60 bg-astro-admin-bg px-1.5 text-center text-xs font-extrabold text-astro-text focus:outline-none"
      />
      <button type="submit" disabled={!valid} className="px-1 text-[11.5px] font-bold text-astro-cyan disabled:opacity-40">
        Save
      </button>
      {goal.minute != null && (
        <button type="button" onClick={() => save(null)} className="px-1 text-[11.5px] font-bold text-astro-text-dim hover:text-astro-red">
          Clear
        </button>
      )}
    </form>
  )
}

function GoalEditor({
  game,
  teams,
  checkedIn,
  act,
  picking,
  setPicking,
}: {
  game: api.PitchGame
  teams: TeamWithMembers[]
  checkedIn: Set<string>
  act: ReturnType<typeof usePitchAction>
  picking: Picking | null
  setPicking: (p: Picking | null) => void
}) {
  const side = (id: string) => teams.find((t) => t.id === id)!
  const nameOf = (id: string | null) => teams.flatMap((t) => t.members).find((m) => m.id === id)?.nickname
  // Checked-in players first; if nobody's checked in, the whole drawn side.
  const playersFor = (t: TeamWithMembers) => {
    const here = t.members.filter((m) => checkedIn.has(m.id))
    return here.length ? here : t.members
  }
  const scorer = (teamId: string, scorerId: string | null) => {
    if (!game.ended_at) navigator.vibrate?.(40)
    act.mutate((by) => api.addGoal(game, teamId, scorerId, by), {
      onSuccess: (goalId) => setPicking({ teamId, step: 'assist', goalId: goalId as string, scorerId, assistId: null }),
      onError: fail('save that goal'),
    })
    setPicking(null)
  }

  return (
    <>
      {picking && (
        <GoalPicker
          team={side(picking.teamId)}
          players={playersFor(side(picking.teamId))}
          picking={picking}
          onScorer={(id) => {
            if (picking.step !== 'fix-scorer') return scorer(picking.teamId, id)
            const clash = !!id && id === picking.assistId
            act.mutate(() => api.updateGoal(picking.goalId, clash ? { scorer_id: id, assist_id: null } : { scorer_id: id }), { onError: fail('change the scorer') })
            setPicking(id && (clash || !picking.assistId) ? { teamId: picking.teamId, step: 'assist', goalId: picking.goalId, scorerId: id, assistId: null } : null)
          }}
          onAssist={(id) => {
            if (picking.step === 'assist' && id !== picking.assistId) act.mutate(() => api.updateGoal(picking.goalId, { assist_id: id }), { onError: fail('save the assist') })
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}

      {game.goals.length > 0 && (
        <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card px-3.5 py-2">
          <ul className="divide-y divide-white/[0.06]">
            {[...game.goals].reverse().map((g) => {
              const t = side(g.team_id)
              return (
                <li key={g.id} className="flex items-center gap-2.5 py-2">
                  <GoalTime goal={g} lengthMin={game.length_min} act={act} />
                  <TeamDot team={t} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-astro-text">
                    <button
                      type="button"
                      onClick={() => setPicking({ teamId: g.team_id, step: 'fix-scorer', goalId: g.id, assistId: g.assist_id })}
                      className={cn('font-extrabold underline decoration-white/20 decoration-dotted underline-offset-4 hover:decoration-current', !g.scorer_id && 'text-astro-amber')}
                    >
                      {nameOf(g.scorer_id) ?? 'Scorer to add'}
                    </button>
                    {g.assist_id && (
                      <>
                        <span className="text-astro-text-muted"> · </span>
                        <button
                          type="button"
                          onClick={() => setPicking({ teamId: g.team_id, step: 'assist', goalId: g.id, scorerId: g.scorer_id, assistId: g.assist_id })}
                          className="text-astro-text-muted underline decoration-white/20 decoration-dotted underline-offset-4 hover:text-astro-text"
                        >
                          {nameOf(g.assist_id)}
                        </button>
                      </>
                    )}
                  </span>
                  {!g.assist_id && g.scorer_id && (
                    <button
                      type="button"
                      onClick={() => setPicking({ teamId: g.team_id, step: 'assist', goalId: g.id, scorerId: g.scorer_id, assistId: null })}
                      className="text-[11.5px] font-bold text-astro-cyan hover:underline"
                    >
                      + Assist
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Undo goal"
                    onClick={() => act.mutate(() => api.deleteGoal(g.id), { onSuccess: () => toast('Goal removed.'), onError: fail('remove that goal') })}
                    className="px-1.5 text-base font-bold text-astro-text-dim hover:text-astro-red"
                  >
                    &times;
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}

function LiveGame({
  game,
  teams,
  checkedIn,
  act,
}: {
  game: api.PitchGame
  teams: TeamWithMembers[]
  checkedIn: Set<string>
  act: ReturnType<typeof usePitchAction>
}) {
  const running = !!game.running_since
  const now = useNow(running)
  useWakeLock(running)
  const { over, label, progress } = countdown(game, now)
  const [picking, setPicking] = useState<Picking | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [report, setReport] = useState(game.report ?? '')
  const side = (id: string) => teams.find((t) => t.id === id)!
  const a = side(game.team_a_id)
  const b = side(game.team_b_id)
  const score = (teamId: string) => game.goals.filter((g) => g.team_id === teamId).length
  const reached = [a, b].find((t) => score(t.id) >= game.goal_target)
  return (
    <div className="flex flex-col gap-3.5">
      <section className="overflow-hidden rounded-[16px] border border-white/[0.09] bg-astro-admin-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
          {[a, b].map((t, i) => (
            <div key={t.id} className={cn('flex flex-col items-center gap-2 px-3 py-4', i === 1 && 'col-start-3')} style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${t.colour} 18%, transparent), transparent)` }}>
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-astro-text">
                <TeamDot team={t} />
                {t.greek_name}
              </span>
              <span className="font-display text-[64px] leading-none text-astro-text tabular-nums">{score(t.id)}</span>
              <button
                type="button"
                disabled={act.isPending}
                onClick={() => setPicking({ teamId: t.id, step: 'scorer' })}
                className="min-h-11 w-full rounded-[10px] text-[14px] font-extrabold text-[#04121d] disabled:opacity-60"
                style={{ background: t.colour }}
              >
                + Goal
              </button>
            </div>
          ))}
          <div className="col-start-2 row-start-1 flex flex-col items-center justify-center gap-1.5 px-2">
            <span className={cn('font-display text-[34px] leading-none tabular-nums', over ? 'text-astro-red' : 'text-astro-text')}>{label}</span>
            <span className={cn('text-[10px] font-extrabold uppercase tracking-[0.12em]', over ? 'text-astro-red' : 'text-astro-text-dim')}>
              {over ? 'Over time' : `First to ${game.goal_target}`}
            </span>
            <button
              type="button"
              onClick={() => act.mutate(() => api.setRunning(game, !running), { onError: fail(running ? 'pause' : 'restart the clock') })}
              className={cn(
                'mt-1 min-h-9 rounded-full border px-3.5 text-xs font-extrabold',
                running ? 'border-white/[0.16] text-astro-text' : 'border-astro-green/60 bg-astro-green/[0.12] text-astro-green',
              )}
            >
              {running ? 'Pause' : 'Resume'}
            </button>

          </div>
        </div>
        <div className="h-1 bg-white/[0.06]">
          <div className={cn('h-full transition-[width] duration-300', over ? 'bg-astro-red' : 'bg-astro-cyan')} style={{ width: `${progress * 100}%` }} />
        </div>
      </section>

      {reached && !picking && (
        <div className="flex items-center gap-3 rounded-[14px] border-2 p-3.5" style={{ borderColor: reached.colour, background: `color-mix(in srgb, ${reached.colour} 12%, transparent)` }}>
          <span className="min-w-0 flex-1 text-[14px] font-extrabold text-astro-text">
            {reached.greek_name} reach {game.goal_target}. That&rsquo;s the game.
          </span>
          <button type="button" onClick={() => setConfirmEnd(true)} className="min-h-10 shrink-0 rounded-[10px] px-3.5 text-[13px] font-extrabold text-[#04121d]" style={{ background: reached.colour }}>
            Full time
          </button>
        </div>
      )}

      <GoalEditor game={game} teams={teams} checkedIn={checkedIn} act={act} picking={picking} setPicking={setPicking} />

      <button
        type="button"
        onClick={() => setConfirmEnd(true)}
        className={cn('min-h-12 rounded-[12px] border text-[14px] font-extrabold', over ? 'border-astro-amber bg-astro-amber text-[#20150a]' : 'border-white/[0.14] text-astro-text')}
      >
        Full time
      </button>

      <AdminConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        eyebrow="Pitch-side"
        title={`Full time: ${a.greek_name} ${score(a.id)}, ${b.greek_name} ${score(b.id)}`}
        body="The clock stops and the match report posts to the feed. You can still edit the goals afterwards from the finished list."
        confirmLabel="Blow the whistle"
        isPending={act.isPending}
        onConfirm={() => act.mutate(() => api.endGame(game, report), { onSuccess: () => setConfirmEnd(false), onError: fail('end the game') })}
      >
        <RichEditor
          value={report}
          onChange={setReport}
          variant="basic"
          placeholder="A line about the game, if you like"
          aria-label="Match report write-up"
          className="mb-4"
        />
      </AdminConfirmDialog>
    </div>
  )
}

/* ---------------- New game + finished games ---------------- */

function Chips<T extends number>({ label, values, value, onChange, fmt }: { label: string; values: T[]; value: T; onChange: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-[68px] text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn('min-h-8 rounded-full border px-3 text-xs font-bold', value === v ? 'border-astro-cyan/60 bg-astro-cyan/[0.12] text-astro-text' : 'border-white/[0.1] text-astro-text-muted')}
        >
          {fmt(v)}
        </button>
      ))}
    </div>
  )
}

const TARGETS = [1, 2, 3]

/** Minutes box: saves on Enter or blur, 1 to 90. */
function MinutesInput({ value, onSave, className }: { value: number; onSave: (min: number) => void; className?: string }) {
  const [text, setText] = useState(String(value))
  const [prev, setPrev] = useState(value)
  if (prev !== value) {
    setPrev(value)
    setText(String(value))
  }
  const commit = () => {
    const n = Number(text)
    if (Number.isInteger(n) && n >= 1 && n <= 90 && n !== value) onSave(n)
    else setText(String(value))
  }
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={90}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setText(String(value))
      }}
      aria-label="Game length in minutes"
      className={cn('h-8 w-14 rounded-full border bg-astro-admin-bg px-2 text-center text-xs font-bold text-astro-text focus:border-astro-cyan/60 focus:outline-none', className)}
    />
  )
}

function NewGame({ teams, pitch, act, matchdayId }: { teams: TeamWithMembers[]; pitch: api.PitchState; act: ReturnType<typeof usePitchAction>; matchdayId: string }) {
  const greek = teams.map((t) => t.id)
  const finished = pitch.games.filter((g) => g.ended_at)
  const saved = pitch.session
  const order = saved ? [...saved.team_order.filter((id) => greek.includes(id)), ...greek.filter((id) => !saved.team_order.includes(id))] : greek
  const session: api.PitchSession = { team_order: order, goal_target: saved?.goal_target ?? 2, length_min: saved?.length_min ?? finished.at(-1)?.length_min ?? 10 }
  const rot = rotation(order, finished, greek)
  const [override, setOverride] = useState<string[] | null>(null)
  const picked = override ?? rot.next ?? []
  const side = (id: string) => teams.find((t) => t.id === id)!
  const save = (patch: Partial<api.PitchSession>) => act.mutate(() => api.saveSession(matchdayId, { ...session, ...patch }), { onError: fail('save that') })
  const toggle = (id: string) => setOverride((p) => {
    const cur = p ?? rot.next ?? []
    return cur.includes(id) ? cur.filter((x) => x !== id) : cur.length === 2 ? [cur[1], id] : [...cur, id]
  })
  const offRotation = !!override && !(rot.next && override.length === 2 && override.every((id) => rot.next!.includes(id)))
  const waiting = rot.queue.filter((id) => !picked.includes(id))

  return (
    <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
      <h2 className="mb-1 font-display text-[26px] leading-none text-astro-text">{finished.length === 0 ? 'Game 1' : `Game ${finished.length + 1}`}</h2>
      <p className="mb-3 text-[12.5px] text-astro-text-muted">
        {offRotation
          ? 'Your pick, off the rotation.'
          : rot.on
            ? `${side(rot.on).greek_name} won, so they stay on.`
            : finished.length === 0
              ? 'Winner stays on. A draw sends both off.'
              : 'Last game was a draw, so both went off. Next two in.'}
        {offRotation && rot.next && (
          <button type="button" onClick={() => setOverride(null)} className="ml-1.5 font-bold text-astro-cyan hover:underline">
            Back to {side(rot.next[0]).greek_name} v {side(rot.next[1]).greek_name}
          </button>
        )}
      </p>

      {finished.length === 0 && (
        <div className="mb-4 rounded-[10px] border border-white/[0.07] bg-astro-admin-bg p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">Opening order</span>
            <button type="button" onClick={() => { setOverride(null); save({ team_order: shuffled(greek) }) }} className="ml-auto text-xs font-bold text-astro-cyan hover:underline">
              Shuffle
            </button>
            {order.some((id, i) => id !== greek[i]) && (
              <button type="button" onClick={() => { setOverride(null); save({ team_order: greek }) }} className="text-xs font-bold text-astro-text-muted hover:text-astro-text">
                Alpha first
              </button>
            )}
          </div>
          <ol className="flex flex-wrap gap-1.5">
            {order.map((id, i) => (
              <li key={id} className="flex items-center gap-1.5 rounded-full border border-white/[0.09] px-2.5 py-1 text-[12px] font-bold text-astro-text">
                <span className="text-astro-text-dim">{i + 1}</span>
                <TeamDot team={side(id)} />
                {side(id).greek_name}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((t) => {
          const at = picked.indexOf(t.id)
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={at >= 0}
              onClick={() => toggle(t.id)}
              className={cn('flex min-h-12 items-center gap-2 rounded-[10px] border-2 px-3 text-[14px] font-extrabold', at >= 0 ? 'text-astro-text' : 'border-white/[0.08] text-astro-text-muted')}
              style={at >= 0 ? { borderColor: t.colour, background: `color-mix(in srgb, ${t.colour} 14%, transparent)` } : undefined}
            >
              <TeamDot team={t} />
              {t.greek_name}
              {at >= 0 && <span className="ml-auto text-[10px] text-astro-text-dim">{t.id === rot.on && !offRotation ? 'STAYS' : at === 0 ? 'HOME' : 'AWAY'}</span>}
            </button>
          )
        })}
      </div>
      {waiting.length > 0 && !offRotation && (
        <p className="mb-4 text-[12px] text-astro-text-muted">
          Then: {waiting.map((id) => side(id).greek_name).join(', ')}
        </p>
      )}
      <div className="mb-4 flex flex-col gap-2">
        <Chips label="First to" values={TARGETS} value={session.goal_target} onChange={(v) => save({ goal_target: v })} fmt={(v) => `${v} goal${v > 1 ? 's' : ''}`} />
        <div className="flex flex-wrap items-center gap-1.5">
          <Chips label="Length" values={LENGTHS} value={session.length_min} onChange={(v) => save({ length_min: v })} fmt={(v) => `${v} min`} />
          <MinutesInput
            value={session.length_min}
            onSave={(v) => save({ length_min: v })}
            className={LENGTHS.includes(session.length_min) ? 'border-white/[0.1]' : 'border-astro-cyan/60 bg-astro-cyan/[0.12]'}
          />
          <span className="text-xs text-astro-text-dim">min</span>
        </div>
      </div>
      <button
        type="button"
        disabled={picked.length !== 2 || act.isPending}
        onClick={() =>
          act.mutate(
            async () => {
              if (!saved) await api.saveSession(matchdayId, session)
              return api.startGame(matchdayId, picked[0], picked[1], session.length_min, session.goal_target)
            },
            { onSuccess: () => setOverride(null), onError: fail('start the game') },
          )
        }
        className="min-h-12 w-full rounded-[12px] bg-astro-cyan text-[15px] font-extrabold text-[#04121d] disabled:opacity-40"
      >
        Kick off
      </button>
    </section>
  )
}

/** A finished game edited in place: goals save as you go, Done rewrites the match report. */
function EditGame({ game, teams, checkedIn, act, onDone }: { game: api.PitchGame; teams: TeamWithMembers[]; checkedIn: Set<string>; act: ReturnType<typeof usePitchAction>; onDone: () => void }) {
  const [picking, setPicking] = useState<Picking | null>(null)
  const [report, setReport] = useState(game.report ?? '')
  const side = (id: string) => teams.find((t) => t.id === id)!

  return (
    <div className="mt-2 flex w-full flex-col gap-3 border-t border-white/[0.06] pt-3">
      <div className="grid grid-cols-2 gap-2">
        {[side(game.team_a_id), side(game.team_b_id)].map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={act.isPending}
            onClick={() => setPicking({ teamId: t.id, step: 'scorer' })}
            className="min-h-10 rounded-[10px] border-2 text-[13px] font-extrabold text-astro-text disabled:opacity-60"
            style={{ borderColor: t.colour, background: `color-mix(in srgb, ${t.colour} 12%, transparent)` }}
          >
            + Goal {t.greek_name}
          </button>
        ))}
      </div>
      <GoalEditor game={game} teams={teams} checkedIn={checkedIn} act={act} picking={picking} setPicking={setPicking} />
      <RichEditor value={report} onChange={setReport} variant="basic" placeholder="A line about the game, if you like" aria-label="Match report write-up" />
      <button
        type="button"
        disabled={act.isPending}
        onClick={() =>
          act.mutate(() => api.saveEdit(game.id, report), {
            onSuccess: () => {
              toast.success('Saved. The match report is updated.')
              onDone()
            },
            onError: fail('save the changes'),
          })
        }
        className="min-h-11 rounded-[10px] bg-astro-cyan text-[14px] font-extrabold text-[#04121d] disabled:opacity-60"
      >
        Done
      </button>
    </div>
  )
}

function FinishedGames({ games, teams, checkedIn, act }: { games: api.PitchGame[]; teams: TeamWithMembers[]; checkedIn: Set<string>; act: ReturnType<typeof usePitchAction> }) {
  const [deleting, setDeleting] = useState<api.PitchGame | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  if (games.length === 0) return null
  const side = (id: string) => teams.find((t) => t.id === id)!
  return (
    <section>
      <h2 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#4d5578]">Finished</h2>
      <ul className="flex flex-col gap-2">
        {games.map((g, i) => {
          const [a, b] = [side(g.team_a_id), side(g.team_b_id)]
          const s = (id: string) => g.goals.filter((x) => x.team_id === id).length
          const missing = g.goals.filter((x) => !x.scorer_id).length
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-white/[0.08] bg-astro-admin-card px-3.5 py-2.5">
              <span className="text-[11px] font-extrabold text-astro-text-dim">G{i + 1}</span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px] font-bold text-astro-text">
                <TeamDot team={a} />
                {a.greek_name}
                <span className="font-display px-1 text-[20px] leading-none">
                  {s(a.id)}&ndash;{s(b.id)}
                </span>
                {b.greek_name}
                <TeamDot team={b} />
              </span>
              {missing > 0 && <span className="text-[11px] font-bold text-astro-amber">{missing} scorer{missing > 1 ? 's' : ''} to add</span>}
              {editingId !== g.id && (
                <button type="button" onClick={() => setEditingId(g.id)} className="text-xs font-bold text-astro-cyan hover:underline">
                  Edit
                </button>
              )}
              <button type="button" onClick={() => setDeleting(g)} className="text-xs font-bold text-astro-text-dim hover:text-astro-red">
                Delete
              </button>
              {editingId === g.id && <EditGame game={g} teams={teams} checkedIn={checkedIn} act={act} onDone={() => setEditingId(null)} />}
            </li>
          )
        })}
      </ul>
      <AdminConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        eyebrow="Pitch-side"
        title="Delete this game?"
        body="Its goals go with it. Use this for a game started by mistake."
        confirmLabel="Delete game"
        isPending={act.isPending}
        onConfirm={() => deleting && act.mutate(() => api.deleteGame(deleting.id), { onSuccess: () => setDeleting(null), onError: fail('delete it') })}
      />
    </section>
  )
}

/* ---------------- Draw ---------------- */

function DrawStep({ matchdayId, capacity }: { matchdayId: string; capacity: number }) {
  const { data: confirmed = [], isLoading } = useConfirmedPlayers(matchdayId)
  const { data: savedRules } = useDrawRules()
  const saveRules = useSaveDrawRules()
  const preview = usePreviewTeamDraw(matchdayId)
  const publish = usePublishTeamDraw(matchdayId)
  const [draft, setDraft] = useState<DrawRules | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ready = confirmed.length > 0 && confirmed.length % 6 === 0
  if (isLoading || !savedRules) return <PageLoader />

  const rules = draft ?? savedRules
  const changed = draft != null && JSON.stringify(draft) !== JSON.stringify(savedRules)
  const nameOf = (id: string) => confirmed.find((p) => p.id === id)?.nickname ?? 'Player'
  const on = RULE_ORDER.filter((k) => rules[k])
  const roll = () => preview.mutate(rules, { onError: (e) => toast.error(e instanceof Error ? e.message : 'The draw failed.') })
  const setRules = (next: DrawRules) => {
    setDraft(next)
    preview.reset()
  }

  return (
    <section className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-4">
      <h2 className="mb-1 font-display text-[26px] leading-none text-astro-text">The draw</h2>
      <p className="mb-3 text-[12.5px] text-astro-text-muted">
        {ready
          ? `Splits the ${confirmed.length} confirmed into ${confirmed.length / 6} teams of 6. You see the sides first, then publish them to everyone.`
          : `Needs a full squad in sixes. ${confirmed.length} of ${capacity} confirmed so far.`}
      </p>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-[34px] leading-none text-astro-text">
          {confirmed.length}/{capacity}
        </span>
        <span className="text-[13px] text-astro-text-muted">paid and confirmed</span>
      </div>

      <div className="mb-3 rounded-[12px] border border-white/[0.08]">
        <button type="button" onClick={() => setShowRules((v) => !v)} aria-expanded={showRules} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">Rules</span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-astro-text-muted">
            {on.length ? on.map((k) => RULE_COPY[k].label).join(', ') : 'Pure random'}
          </span>
          {changed && <span className="rounded-[4px] bg-astro-amber/20 px-1.5 text-[10px] font-extrabold uppercase text-astro-amber">This draw</span>}
          <span className="text-[12px] font-bold text-astro-cyan">{showRules ? 'Done' : 'Change'}</span>
        </button>
        {showRules && (
          <div className="border-t border-white/[0.06] p-2">
            <DrawRulesForm rules={rules} onChange={setRules} />
            {changed && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveRules.mutate(rules, { onSuccess: () => { setDraft(null); toast.success('Saved as the default') } })}
                  className="min-h-9 flex-1 rounded-[10px] border border-astro-cyan/50 text-[12.5px] font-bold text-astro-cyan"
                >
                  Save as default
                </button>
                <button type="button" onClick={() => setRules(savedRules)} className="min-h-9 flex-1 rounded-[10px] border border-white/[0.1] text-[12.5px] font-bold text-astro-text-muted">
                  Back to defaults
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {preview.data ? (
        <>
          <DrawPreviewCard preview={preview.data} nameOf={nameOf} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" disabled={preview.isPending} onClick={roll} className="min-h-12 rounded-[12px] border border-white/[0.14] text-[14px] font-extrabold text-astro-text disabled:opacity-40">
              {preview.isPending ? 'Re-rolling…' : 'Re-roll'}
            </button>
            <button type="button" onClick={() => setConfirming(true)} className="min-h-12 rounded-[12px] bg-astro-cyan text-[14px] font-extrabold text-[#04121d]">
              Publish teams
            </button>
          </div>
          <AdminConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            eyebrow="The draw"
            title="Publish these teams?"
            body="Posts the sides to the feed and tells every player their team. You can still swap players at check-in."
            confirmLabel="Publish"
            isPending={publish.isPending}
            onConfirm={() =>
              publish.mutate(preview.data!.teams, {
                onSuccess: () => {
                  setConfirming(false)
                  toast.success('Teams are out')
                },
                onError: (e) => toast.error(e instanceof Error ? e.message : 'Couldn’t publish the teams.'),
              })
            }
          />
        </>
      ) : (
        <>
          <ul className="mb-4 flex flex-wrap gap-1.5">
            {confirmed.map((p) => (
              <li key={p.id} className="rounded-full border border-white/[0.09] px-2.5 py-1 text-[12px] font-bold text-astro-text-muted">
                {p.nickname}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!ready || preview.isPending}
            onClick={roll}
            className="min-h-12 w-full rounded-[12px] bg-astro-cyan text-[15px] font-extrabold text-[#04121d] disabled:opacity-40"
          >
            {preview.isPending ? 'Drawing the sides…' : 'Run the draw'}
          </button>
        </>
      )}
    </section>
  )
}

/* ---------------- Page ---------------- */

export function PitchSidePage() {
  const navigate = useNavigate()
  const { data: matchday, isLoading: mdLoading, isError: mdError, refetch } = useNextMatchday()
  const drawn = matchday?.status === 'drawn' ? matchday : undefined
  const { data: teams = [], isLoading: teamsLoading } = useDrawnTeams(drawn?.id)
  const { data: pitch, isLoading: pitchLoading, isError: pitchError } = usePitch(drawn?.id)
  const action = usePitchAction(drawn?.id)
  const [tab, setTab] = useState<Tab | null>(null)
  // Chosen once on load, so the first check-in doesn't flip the tab.
  if (pitch && tab === null) setTab(pitch.checkedIn.size > 0 || pitch.games.length > 0 ? 'games' : 'checkin')

  const live = pitch?.games.find((g) => !g.ended_at)
  const finished = useMemo(() => pitch?.games.filter((g) => g.ended_at) ?? [], [pitch])

  if (mdLoading || teamsLoading || pitchLoading) return <PageLoader />
  if (mdError || pitchError) return <ErrorState onRetry={() => refetch()} />
  if (matchday?.status === 'open')
    return (
      <div className="mx-auto max-w-[640px]">
        <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
          {new Date(matchday.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {matchday.venue ? ` · ${matchday.venue}` : ''}
        </div>
        <h1 className="mb-4 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Pitch-side</h1>
        <DrawStep matchdayId={matchday.id} capacity={matchday.capacity} />
      </div>
    )
  if (!drawn || teams.length < 2)
    return (
      <div>
        <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Pitch-side</h1>
        <EmptyState icon={<EmptyPitchIcon />} title="No teams drawn yet." body="Pitch-side opens once the teams for the next matchday are drawn." />
      </div>
    )

  const checkedIn = pitch?.checkedIn ?? new Set<string>()
  const current: Tab = tab ?? 'checkin'
  const act = action

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        {new Date(drawn.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        {drawn.venue ? ` · ${drawn.venue}` : ''}
      </div>
      <h1 className="mb-4 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Pitch-side</h1>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-[12px] border border-white/[0.09] bg-astro-admin-card p-1" role="tablist">
        {(
          [
            ['checkin', `Check-in · ${checkedIn.size}`],
            ['games', live ? 'Games · live' : `Games · ${finished.length}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setTab(id)}
            className={cn('min-h-10 rounded-[9px] text-[13px] font-extrabold', current === id ? 'bg-astro-cyan/[0.16] text-astro-text' : 'text-astro-text-muted')}
          >
            {label}
            {id === 'games' && live?.running_since && <span className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-astro-red align-middle" />}
          </button>
        ))}
      </div>

      {current === 'checkin' ? (
        <CheckIn teams={teams} checkedIn={checkedIn} act={act} matchdayId={drawn.id} />
      ) : (
        <div className="flex flex-col gap-5">
          {live ? <LiveGame key={live.id} game={live} teams={teams} checkedIn={checkedIn} act={act} /> : <NewGame teams={teams} pitch={pitch!} act={act} matchdayId={drawn.id} />}
          <FinishedGames games={finished} teams={teams} checkedIn={checkedIn} act={act} />
          {pitch && <DayTable teams={teams} pitch={pitch} className="rounded-[14px] border border-white/[0.09] bg-astro-admin-card p-3.5" />}
          {finished.length > 0 && !live && (
            <button
              type="button"
              onClick={() => navigate({ to: '/admin/results' })}
              className="min-h-12 rounded-[12px] border border-astro-cyan/50 text-[14px] font-extrabold text-astro-cyan hover:bg-astro-cyan/[0.08]"
            >
              Done for the day: review and file results &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
