import { confirmAction, undoToast, withConfirm } from '@/components/dialogs/confirm'
import { useState } from 'react'
import { toast } from 'sonner'
import { AstroSelect } from '@/components/ui/astro-select'
import { Button } from '@/components/ui/button'
import { AdminConfirmDialog } from '@/components/dialogs/AdminConfirmDialog'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useActivePlayers } from '@/features/matchday/hooks'
import { FieldHint, FieldLabel, TextField } from '@/features/edit-profile/components/FieldInput'
import {
  useAddPlayerToSquad,
  useCreateCupMatch,
  useCreateCupQuarter,
  useCupEntrants,
  useCupMatches,
  useCupSquads,
  useCurrentCup,
  useDeleteCupMatch,
  useRecordCupMatchScore,
  useRemovePlayerFromSquad,
  useRenameSquad,
  useRunCupDraw,
  useUpdateCupStatus,
} from '@/features/salami-cup/hooks'
import type { CupGoal, CupMatch, CupSquad, CupStatus } from '@/features/salami-cup/api'

function inDaysAt(days: number, time: string): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.toISOString().slice(0, 10)}T${time}`
}

function CreateQuarterForm() {
  const createQuarter = useCreateCupQuarter()
  const [label, setLabel] = useState(`Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`)
  const [venue, setVenue] = useState('')
  const [scheduledAt, setScheduledAt] = useState(inDaysAt(14, '07:45'))
  const [entriesCloseAt, setEntriesCloseAt] = useState(inDaysAt(11, '20:00'))
  const [withdrawalDeadline, setWithdrawalDeadline] = useState(inDaysAt(13, '19:00'))
  const [error, setError] = useState<string | null>(null)

  async function open() {
    if (!label.trim()) {
      setError('Give it a label.')
      return
    }
    setError(null)
    try {
      await createQuarter.mutateAsync({
        label: label.trim(),
        venue: venue.trim() || null,
        scheduledAt: new Date(scheduledAt).toISOString(),
        entriesCloseAt: new Date(entriesCloseAt).toISOString(),
        withdrawalDeadline: new Date(withdrawalDeadline).toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="astro-card max-w-lg p-6">
      <div className="flex flex-col gap-4">
        <TextField label="Label" value={label} onChange={setLabel} hint="e.g. Q3 2026" />
        <TextField label="Venue" value={venue} onChange={setVenue} />
        <div>
          <FieldLabel>Kick-off</FieldLabel>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm text-astro-text"
          />
        </div>
        <div>
          <FieldLabel>Entries close</FieldLabel>
          <input
            type="datetime-local"
            value={entriesCloseAt}
            onChange={(e) => setEntriesCloseAt(e.target.value)}
            className="w-full rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm text-astro-text"
          />
        </div>
        <div>
          <FieldLabel>Withdrawal deadline</FieldLabel>
          <input
            type="datetime-local"
            value={withdrawalDeadline}
            onChange={(e) => setWithdrawalDeadline(e.target.value)}
            className="w-full rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm text-astro-text"
          />
          <FieldHint>After this, a short squad just plays short. No standby swap.</FieldHint>
        </div>
        {error && <p className="text-xs text-astro-red">{error}</p>}
        <Button onClick={open} disabled={createQuarter.isPending} className="w-fit">
          {createQuarter.isPending ? 'Opening…' : 'Open entries'}
        </Button>
      </div>
    </div>
  )
}

function StatusControls({ cupId, status }: { cupId: string; status: CupStatus }) {
  const updateStatus = useUpdateCupStatus(cupId)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const NEXT: Partial<Record<CupStatus, CupStatus>> = { drawn: 'live', live: 'played' }
  const next = NEXT[status]

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {next && (
        <Button onClick={() => withConfirm({ tone: 'admin', eyebrow: 'Salami Cup', title: next === 'live' ? 'Start the cup?' : 'Mark the cup played?', body: next === 'live' ? 'Everyone sees it as live now.' : 'It closes the cup and the results become final.', confirmLabel: `Mark ${next}` }, () => updateStatus.mutate(next))} disabled={updateStatus.isPending} className="w-fit">
          {updateStatus.isPending ? 'Updating…' : `Mark ${next}`}
        </Button>
      )}
      {status !== 'played' && status !== 'cancelled' && (
        <button
          type="button"
          onClick={() => setConfirmingCancel(true)}
          className="text-xs font-bold text-astro-text-dim hover:text-astro-red"
        >
          Cancel this cup
        </button>
      )}
      <AdminConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        eyebrow="Salami Cup"
        title="Cancel this cup?"
        body="The quarter is scrapped. Entrants and any squads already drawn stay on record, but the cup won't run."
        confirmLabel="Cancel it"
        isPending={updateStatus.isPending}
        onConfirm={() => {
          updateStatus.mutate('cancelled')
          setConfirmingCancel(false)
        }}
      />
    </div>
  )
}

function SquadsPanel({ cupId }: { cupId: string }) {
  const { data: squads = [] } = useCupSquads(cupId)
  const { data: players = [] } = useActivePlayers()
  const renameSquad = useRenameSquad(cupId)
  const addPlayer = useAddPlayerToSquad(cupId)
  const removePlayer = useRemovePlayerFromSquad(cupId)
  const [adding, setAdding] = useState<Record<string, string>>({})

  return (
    <div className="flex flex-col gap-3">
      {squads.map((s) => (
        <div key={s.id} className="astro-card p-5">
          <input
            defaultValue={s.name}
            onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && renameSquad.mutate({ squadId: s.id, name: e.target.value.trim() })}
            className="font-display mb-3 w-full bg-transparent text-2xl leading-none text-astro-text outline-none"
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {s.members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-astro-text-muted">
                {m.nickname}
                <button type="button" onClick={() => removePlayer.mutate({ squadId: s.id, playerId: m.id }, { onSuccess: () => undoToast(`${m.nickname} out of ${s.name}`, () => addPlayer.mutate({ squadId: s.id, playerId: m.id })) })} className="text-astro-text-dim hover:text-astro-red">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <AstroSelect
              size="sm"
              placeholder="Add a player…"
              value={adding[s.id] ?? ''}
              onValueChange={(v) => setAdding({ ...adding, [s.id]: v })}
              options={players
                .filter((p) => !s.members.some((m) => m.id === p.id))
                .map((p) => ({ value: p.id, label: p.nickname }))}
              className="flex-1"
            />
            <button
              type="button"
              disabled={!adding[s.id]}
              onClick={() => {
                addPlayer.mutate({ squadId: s.id, playerId: adding[s.id] })
                setAdding({ ...adding, [s.id]: '' })
              }}
              className="rounded-lg border border-border bg-astro-surface-2 px-3 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text"
            >
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const SCORE_INPUT = 'font-display w-12 shrink-0 rounded-lg border border-white/10 bg-astro-surface px-1 py-2 text-center text-lg text-astro-text'

interface ScorerDraft {
  id: string
  ownGoal: boolean
}

function ScorerList({
  squad,
  opponent,
  max,
  scorers,
  onChange,
}: {
  squad: CupSquad | undefined
  opponent: CupSquad | undefined
  max: number
  scorers: ScorerDraft[]
  onChange: (next: ScorerDraft[]) => void
}) {
  const options = (s: CupSquad | undefined) => (s?.members ?? []).map((p) => ({ value: p.id, label: p.nickname }))
  const patch = (i: number, next: Partial<ScorerDraft>) => onChange(scorers.map((x, j) => (j === i ? { ...x, ...next } : x)))
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {scorers.map((g, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={g.ownGoal}
            aria-label="Own goal"
            title="Own goal"
            onClick={() => patch(i, { ownGoal: !g.ownGoal, id: '' })}
            className={
              g.ownGoal
                ? 'h-8 shrink-0 rounded-[7px] border border-astro-red/60 bg-astro-red/15 px-1.5 text-[10.5px] font-extrabold text-astro-red'
                : 'h-8 shrink-0 rounded-[7px] border border-white/[0.1] px-1.5 text-[10.5px] font-extrabold text-astro-text-dim hover:text-astro-text'
            }
          >
            OG
          </button>
          <AstroSelect
            size="sm"
            placeholder={g.ownGoal ? `Which ${opponent?.name ?? 'opponent'} player?` : 'Scorer'}
            value={g.id}
            onValueChange={(v) => patch(i, { id: v })}
            options={options(g.ownGoal ? opponent : squad)}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            aria-label="Remove scorer"
            onClick={() => onChange(scorers.filter((_, j) => j !== i))}
            className="px-1 text-sm font-bold text-astro-text-dim hover:text-astro-red"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={scorers.length >= max}
        onClick={() => onChange([...scorers, { id: '', ownGoal: false }])}
        className="self-start text-[11px] font-bold text-astro-text-dim hover:text-astro-text disabled:opacity-40"
      >
        + Scorer
      </button>
    </div>
  )
}

function FixtureRow({
  match,
  squads,
  saving,
  onSave,
  onRemove,
}: {
  match: CupMatch
  squads: CupSquad[]
  saving: boolean
  onSave: (scoreA: number, scoreB: number, goals: CupGoal[]) => void
  onRemove: () => void
}) {
  const [a, setA] = useState(match.score_a?.toString() ?? '')
  const [b, setB] = useState(match.score_b?.toString() ?? '')
  const draft = (squadId: string) => match.goals.filter((g) => g.squad_id === squadId).map((g) => ({ id: g.scorer_id, ownGoal: g.own_goal }))
  const [scorersA, setScorersA] = useState(() => draft(match.squad_a_id))
  const [scorersB, setScorersB] = useState(() => draft(match.squad_b_id))

  const squadA = squads.find((s) => s.id === match.squad_a_id)
  const squadB = squads.find((s) => s.id === match.squad_b_id)
  const scoreA = Number(a)
  const scoreB = Number(b)
  const tooMany = scorersA.length > scoreA || scorersB.length > scoreB
  const unpicked = [...scorersA, ...scorersB].some((g) => !g.id)

  return (
    <div className="rounded-[11px] bg-astro-surface-2 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-0 flex-1 text-right text-[13px] font-bold text-astro-text">{match.squad_a_name}</div>
        <input type="number" inputMode="numeric" placeholder="0" min={0} value={a} onChange={(e) => setA(e.target.value)} aria-label={`${match.squad_a_name} goals`} className={SCORE_INPUT} />
        <span className="text-astro-text-dim">&ndash;</span>
        <input type="number" inputMode="numeric" placeholder="0" min={0} value={b} onChange={(e) => setB(e.target.value)} aria-label={`${match.squad_b_name} goals`} className={SCORE_INPUT} />
        <div className="min-w-0 flex-1 text-[13px] font-bold text-astro-text">{match.squad_b_name}</div>
        <button
          type="button"
          disabled={a === '' || b === '' || tooMany || unpicked || saving}
          onClick={() =>
            onSave(scoreA, scoreB, [
              ...scorersA.map((g) => ({ squad_id: match.squad_a_id, scorer_id: g.id, own_goal: g.ownGoal })),
              ...scorersB.map((g) => ({ squad_id: match.squad_b_id, scorer_id: g.id, own_goal: g.ownGoal })),
            ])
          }
          className="rounded-lg border border-border bg-astro-surface px-2.5 py-1.5 text-[11px] font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={onRemove} className="text-xs font-bold text-astro-text-dim hover:text-astro-red">
          Remove
        </button>
      </div>
      {a !== '' && b !== '' && scoreA + scoreB > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-2.5">
          <ScorerList squad={squadA} opponent={squadB} max={scoreA} scorers={scorersA} onChange={setScorersA} />
          <ScorerList squad={squadB} opponent={squadA} max={scoreB} scorers={scorersB} onChange={setScorersB} />
        </div>
      )}
      {tooMany && <div className="mt-2 text-[11.5px] font-bold text-astro-red">More scorers than goals. Remove one or fix the score.</div>}
    </div>
  )
}

function FixturesPanel({ cupId }: { cupId: string }) {
  const { data: squads = [] } = useCupSquads(cupId)
  const { data: matches = [] } = useCupMatches(cupId)
  const createMatch = useCreateCupMatch(cupId)
  const recordScore = useRecordCupMatchScore(cupId)
  const deleteMatch = useDeleteCupMatch(cupId)

  const [squadAId, setSquadAId] = useState('')
  const [squadBId, setSquadBId] = useState('')

  return (
    <div className="astro-card p-6">
      <div className="font-display mb-4.5 text-[28px] leading-none text-astro-text">Fixtures</div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AstroSelect
          size="sm"
          placeholder="Squad A"
          value={squadAId}
          onValueChange={setSquadAId}
          options={squads.map((s) => ({ value: s.id, label: s.name }))}
          className="flex-1"
        />
        <span className="text-astro-text-dim">v</span>
        <AstroSelect
          size="sm"
          placeholder="Squad B"
          value={squadBId}
          onValueChange={setSquadBId}
          options={squads.map((s) => ({ value: s.id, label: s.name }))}
          className="flex-1"
        />
        <button
          type="button"
          disabled={!squadAId || !squadBId || squadAId === squadBId || createMatch.isPending}
          onClick={() => {
            createMatch.mutate({ cupQuarterId: cupId, squadAId, squadBId })
            setSquadAId('')
            setSquadBId('')
          }}
          className="rounded-lg border border-border bg-astro-surface-2 px-3 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text"
        >
          + Add fixture
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {matches.map((m) => (
          <FixtureRow
            key={m.id}
            match={m}
            squads={squads}
            saving={recordScore.isPending}
            onSave={(scoreA, scoreB, goals) =>
              withConfirm({ tone: 'admin', eyebrow: 'Salami Cup', title: `Save ${scoreA}–${scoreB}?`, body: 'The score and scorers count towards everyone’s cup stats.', confirmLabel: 'Save result' }, () => recordScore.mutate(
                { matchId: m.id, scoreA, scoreB, goals },
                { onError: (err) => toast.error(err instanceof Error ? err.message : 'Couldn’t save that result.') },
              ))
            }
            onRemove={() => withConfirm({ tone: 'admin', eyebrow: 'Salami Cup', title: 'Delete this fixture?', body: 'Its score and goals go with it.', confirmLabel: 'Delete fixture' }, () => deleteMatch.mutate(m.id))}
          />
        ))}
      </div>
    </div>
  )
}

export function CupAdminPage() {
  const { data: cup, isLoading, isError, refetch } = useCurrentCup()
  const { data: entrants = [] } = useCupEntrants(cup?.id)
  const runDraw = useRunCupDraw(cup?.id)
  const [drawError, setDrawError] = useState<string | null>(null)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const canDraw = entrants.length > 0 && entrants.length % 6 === 0

  async function draw() {
    setDrawError(null)
    const ok = await confirmAction({ tone: 'admin', eyebrow: 'Salami Cup', title: 'Draw the squads?', body: `${entrants.length} entrants into squads of six. Everyone can see their squad straight away.`, confirmLabel: 'Draw squads' })
    if (!ok) return
    try {
      await runDraw.mutateAsync()
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        Quarterly, in Ade&rsquo;s name
      </div>
      <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Salami Cup</h1>

      {!cup || cup.status === 'cancelled' ? (
        <CreateQuarterForm />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="astro-card max-w-lg p-6">
            <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{cup.label}</div>
            <div className="mb-1 font-display text-3xl leading-none text-astro-text">{cup.status}</div>
            <p className="mb-5 text-sm text-astro-text-muted">
              {entrants.length} entrant{entrants.length === 1 ? '' : 's'} &middot; {cup.venue ?? 'No venue set'}
            </p>
            <StatusControls cupId={cup.id} status={cup.status} />
          </div>

          {cup.status === 'open' && (
            <div className="astro-card max-w-lg p-6">
              <div className="font-display mb-2 text-2xl leading-none text-astro-text">Run the draw</div>
              <p className="mb-4 text-[13px] text-astro-text-muted">
                Splits entrants into squads of 6, same random draw Sunday uses. Needs a multiple of 6 entrants.
              </p>
              {drawError && <p className="mb-3 text-xs text-astro-red">{drawError}</p>}
              <Button onClick={draw} disabled={!canDraw || runDraw.isPending} className="w-fit">
                {runDraw.isPending ? 'Drawing…' : `Draw ${entrants.length} entrants`}
              </Button>
              {!canDraw && entrants.length > 0 && (
                <p className="mt-2 text-xs text-astro-text-dim">{entrants.length} isn&rsquo;t a multiple of 6 yet.</p>
              )}
            </div>
          )}

          {cup.status !== 'open' && (
            <>
              <SquadsPanel cupId={cup.id} />
              <FixturesPanel cupId={cup.id} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
