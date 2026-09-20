import { useState } from 'react'
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
import type { CupStatus } from '@/features/salami-cup/api'

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
        <Button onClick={() => updateStatus.mutate(next)} disabled={updateStatus.isPending} className="w-fit">
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
                <button type="button" onClick={() => removePlayer.mutate({ squadId: s.id, playerId: m.id })} className="text-astro-text-dim hover:text-astro-red">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={adding[s.id] ?? ''}
              onChange={(e) => setAdding({ ...adding, [s.id]: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text"
            >
              <option value="">Add a player…</option>
              {players
                .filter((p) => !s.members.some((m) => m.id === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname}
                  </option>
                ))}
            </select>
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

function FixturesPanel({ cupId }: { cupId: string }) {
  const { data: squads = [] } = useCupSquads(cupId)
  const { data: matches = [] } = useCupMatches(cupId)
  const createMatch = useCreateCupMatch(cupId)
  const recordScore = useRecordCupMatchScore(cupId)
  const deleteMatch = useDeleteCupMatch(cupId)

  const [squadAId, setSquadAId] = useState('')
  const [squadBId, setSquadBId] = useState('')
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({})

  return (
    <div className="astro-card p-6">
      <div className="font-display mb-4.5 text-[28px] leading-none text-astro-text">Fixtures</div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={squadAId} onChange={(e) => setSquadAId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text">
          <option value="">Squad A</option>
          {squads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="text-astro-text-dim">v</span>
        <select value={squadBId} onChange={(e) => setSquadBId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text">
          <option value="">Squad B</option>
          {squads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
        {matches.map((m) => {
          const draft = scores[m.id] ?? { a: m.score_a?.toString() ?? '', b: m.score_b?.toString() ?? '' }
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-2.5 rounded-[11px] bg-astro-surface-2 px-3.5 py-3">
              <div className="min-w-0 flex-1 text-right text-[13px] font-bold text-astro-text">{m.squad_a_name}</div>
              <input
                type="number"
                min={0}
                value={draft.a}
                onChange={(e) => setScores({ ...scores, [m.id]: { ...draft, a: e.target.value } })}
                className="font-display w-12 shrink-0 rounded-lg border border-white/10 bg-astro-surface px-1 py-2 text-center text-lg text-astro-text"
              />
              <span className="text-astro-text-dim">&ndash;</span>
              <input
                type="number"
                min={0}
                value={draft.b}
                onChange={(e) => setScores({ ...scores, [m.id]: { ...draft, b: e.target.value } })}
                className="font-display w-12 shrink-0 rounded-lg border border-white/10 bg-astro-surface px-1 py-2 text-center text-lg text-astro-text"
              />
              <div className="min-w-0 flex-1 text-[13px] font-bold text-astro-text">{m.squad_b_name}</div>
              <button
                type="button"
                disabled={draft.a === '' || draft.b === '' || recordScore.isPending}
                onClick={() => recordScore.mutate({ matchId: m.id, scoreA: Number(draft.a), scoreB: Number(draft.b) })}
                className="rounded-lg border border-border bg-astro-surface px-2.5 py-1.5 text-[11px] font-bold text-astro-text-muted hover:text-astro-text"
              >
                Save
              </button>
              <button type="button" onClick={() => deleteMatch.mutate(m.id)} className="text-xs font-bold text-astro-text-dim hover:text-astro-red">
                Remove
              </button>
            </div>
          )
        })}
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
