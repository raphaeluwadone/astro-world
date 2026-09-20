import { useState } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { FieldLabel, TextField } from '@/features/edit-profile/components/FieldInput'
import {
  useAllPlayers,
  useCauseContributors,
  useCauseRaised,
  useCauses,
  useCreateDuesQuarter,
  useCurrentDuesQuarter,
  useDuesPaidCount,
  useDuesPayments,
  useMarkDuesPaid,
  useOpenCause,
  useRecordContribution,
  useSetCauseStatus,
  useUnmarkDuesPaid,
} from '@/features/kitty/hooks'
import type { Cause } from '@/features/kitty/api'

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

function nextQuarter(): { year: number; quarter: number } {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return { year: now.getFullYear(), quarter }
}

/** Plain YYYY-MM-DD for the given local year/month/day, deliberately
 * not going through toISOString(): that converts to UTC first, which
 * silently shifts the date back a day in any timezone behind UTC. */
function localDateInput(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function OpenQuarterForm({ lastAmount }: { lastAmount: number }) {
  const { year, quarter } = nextQuarter()
  const createQuarter = useCreateDuesQuarter()
  const [amount, setAmount] = useState(String(lastAmount || 12000))
  const [dueDate, setDueDate] = useState(localDateInput(year, quarter * 3 - 3, 1))
  const [error, setError] = useState<string | null>(null)

  async function open() {
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Set a real amount.')
      return
    }
    setError(null)
    try {
      await createQuarter.mutateAsync({ year, quarter, amount: parsed, dueDate })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="astro-card max-w-lg p-6">
      <div className="font-display mb-2 text-2xl leading-none text-astro-text">Open Q{quarter} {year}</div>
      <p className="mb-4 text-[13px] text-astro-text-muted">
        The design's own figure is an unconfirmed placeholder. Set the real amount whenever you have it.
      </p>
      <div className="flex flex-col gap-4">
        <TextField label="Amount per player (₦)" type="number" value={amount} onChange={setAmount} />
        <div>
          <FieldLabel>Due date</FieldLabel>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm text-astro-text"
          />
        </div>
        {error && <p className="text-xs text-astro-red">{error}</p>}
        <Button onClick={open} disabled={createQuarter.isPending} className="w-fit">
          {createQuarter.isPending ? 'Opening…' : `Open Q${quarter} ${year}`}
        </Button>
      </div>
    </div>
  )
}

function DuesRoster({ duesQuarterId, markedBy }: { duesQuarterId: string; markedBy: string }) {
  const { data: players = [] } = useAllPlayers()
  const { data: payments = [] } = useDuesPayments(duesQuarterId)
  const markPaid = useMarkDuesPaid(duesQuarterId)
  const unmarkPaid = useUnmarkDuesPaid(duesQuarterId)
  const [search, setSearch] = useState('')

  const paidIds = new Set(payments.map((p) => p.player_id))
  const filtered = players.filter((p) => p.nickname.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="astro-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="font-display text-2xl leading-none text-astro-text">Roster</div>
        <div className="text-[13px] text-astro-text-muted">{paidIds.size} of {players.length} paid</div>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players…"
        className="mb-3 h-9 w-full rounded-[10px] border border-border bg-astro-surface-2 px-3 text-xs text-astro-text placeholder:text-astro-text-dim"
      />
      <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
        {filtered.map((p) => {
          const paid = paidIds.has(p.id)
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-astro-surface-2 px-3.5 py-2.5">
              <span className="truncate text-[13px] font-bold text-astro-text">{p.nickname}</span>
              <button
                type="button"
                disabled={markPaid.isPending || unmarkPaid.isPending}
                onClick={() =>
                  paid ? unmarkPaid.mutate(p.id) : markPaid.mutate({ playerId: p.id, markedBy })
                }
                className={
                  paid
                    ? 'rounded-md border border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] px-2.5 py-1 text-[11px] font-extrabold text-[#4ade80]'
                    : 'rounded-md border border-border bg-astro-surface px-2.5 py-1 text-[11px] font-bold text-astro-text-muted hover:text-astro-text'
                }
              >
                {paid ? 'Paid' : 'Mark paid'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CauseAdminRow({ cause, markedBy }: { cause: Cause; markedBy: string }) {
  const { data: players = [] } = useAllPlayers()
  const { data: raised = 0 } = useCauseRaised(cause.id)
  const { data: contributors = [] } = useCauseContributors(cause.id)
  const openCause = useOpenCause()
  const setStatus = useSetCauseStatus()
  const recordContribution = useRecordContribution(cause.id)

  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [contributorId, setContributorId] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')

  const contributedIds = new Set(contributors.map((c) => c.player_id))

  return (
    <div className="astro-card p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="font-display text-2xl leading-none text-astro-text">{cause.title}</div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-astro-text-dim">{cause.status}</div>
      </div>
      <p className="mb-3.5 text-[13px] text-astro-text-muted">{cause.description}</p>

      {cause.status === 'suggested' ? (
        <div className="flex flex-wrap items-end gap-2.5">
          <TextField label="Target (₦)" type="number" value={targetAmount} onChange={setTargetAmount} />
          <div>
            <FieldLabel>Closing date</FieldLabel>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-[10px] border border-white/10 bg-astro-surface-2 px-3 py-3 text-sm text-astro-text"
            />
          </div>
          <button
            type="button"
            disabled={!targetAmount || !deadline || openCause.isPending}
            onClick={() => openCause.mutate({ causeId: cause.id, targetAmount: Number(targetAmount), deadline })}
            className="rounded-lg bg-astro-green px-4 py-3 text-xs font-extrabold text-[#08130c] disabled:opacity-60"
          >
            Open it
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-[13px] font-bold text-astro-text">
            {formatNaira(raised)} of {formatNaira(cause.target_amount ?? 0)} &middot; {contributors.length} contributors
          </p>
          {cause.status === 'open' && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text"
              >
                <option value="">Add a contribution…</option>
                {players
                  .filter((p) => !contributedIds.has(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="₦ amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-28 rounded-lg border border-white/10 bg-astro-surface-2 px-2.5 py-2 text-xs font-bold text-astro-text"
              />
              <button
                type="button"
                disabled={!contributorId || !contributionAmount || recordContribution.isPending}
                onClick={() => {
                  recordContribution.mutate({
                    playerId: contributorId,
                    amount: Number(contributionAmount),
                    markedBy,
                  })
                  setContributorId('')
                  setContributionAmount('')
                }}
                className="rounded-lg border border-border bg-astro-surface px-3 py-2 text-xs font-bold text-astro-text-muted hover:text-astro-text"
              >
                Add
              </button>
            </div>
          )}
          {cause.status === 'open' && (
            <button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ causeId: cause.id, status: 'met' })}
              className="text-xs font-bold text-astro-text-dim hover:text-astro-green"
            >
              Mark met
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function KittyAdminPage() {
  const { player } = useCurrentPlayer()
  const { data: duesQuarter, isLoading, isError, refetch } = useCurrentDuesQuarter()
  const { data: paidCount = 0 } = useDuesPaidCount(duesQuarter?.id)
  const { data: causes = [] } = useCauses()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!player) return null

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        Dues and causes
      </div>
      <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Kitty</h1>

      <div className="mb-8 flex flex-col gap-5">
        <div className="font-display text-2xl leading-none text-astro-text">Dues</div>
        {!duesQuarter ? (
          <OpenQuarterForm lastAmount={12000} />
        ) : (
          <>
            <div className="astro-card max-w-lg p-6">
              <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                Q{duesQuarter.quarter} {duesQuarter.year}
              </div>
              <div className="font-display mb-1 text-3xl leading-none text-astro-text">
                {formatNaira(duesQuarter.amount)} <span className="text-base text-astro-text-dim">per player</span>
              </div>
              <p className="text-sm text-astro-text-muted">
                Due {new Date(duesQuarter.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} &middot; {paidCount} paid so far
              </p>
            </div>
            <DuesRoster duesQuarterId={duesQuarter.id} markedBy={player.id} />
            <OpenQuarterForm lastAmount={duesQuarter.amount} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="font-display text-2xl leading-none text-astro-text">Causes</div>
        {causes.length === 0 && <p className="text-sm text-astro-text-dim">Nobody has suggested one yet.</p>}
        {causes.map((c) => (
          <CauseAdminRow key={c.id} cause={c} markedBy={player.id} />
        ))}
      </div>
    </div>
  )
}
