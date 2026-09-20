import { useState } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import {
  useAllPlayers,
  useCauseContributors,
  useCauseRaised,
  useCauses,
  useCurrentDuesQuarter,
  useDuesPaidCount,
  useDuesPayments,
  useSuggestCause,
} from './hooks'
import type { Cause } from './api'

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

function CauseCard({ cause }: { cause: Cause }) {
  const { data: raised = 0 } = useCauseRaised(cause.id)
  const { data: contributors = [] } = useCauseContributors(cause.id)
  const target = cause.target_amount ?? 0
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
  const met = cause.status === 'met'

  return (
    <div className="astro-card p-6">
      <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
        {met ? 'Met' : cause.deadline ? `Closes ${new Date(cause.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Open'}
      </div>
      <div className="font-display mb-1.5 text-2xl leading-none text-astro-text">{cause.title}</div>
      <p className="mb-4 text-[13px] text-astro-text-muted [text-wrap:pretty]">{cause.description}</p>

      {target > 0 && (
        <>
          <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-astro-bg">
            <div className="h-full rounded-full bg-astro-green" style={{ width: `${pct}%` }} />
          </div>
          <div className="mb-3.5 flex items-center justify-between text-[12.5px] text-astro-text-muted">
            <span>
              {formatNaira(raised)} of {formatNaira(target)}
            </span>
            <span>{pct}%</span>
          </div>
        </>
      )}

      <div className="mb-1.5 text-[11px] font-bold text-astro-text-dim">
        {contributors.length} of us have chipped in
      </div>
      <div className="flex flex-wrap gap-1.5">
        {contributors.map((c) => (
          <div key={c.player_id} className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-astro-text-muted">
            {c.nickname}
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11px] text-astro-text-dim">
        Amounts are never shown next to names. Chipped in already? Tell an admin so it shows here.
      </p>
    </div>
  )
}

function SuggestCauseForm({ suggestedBy }: { suggestedBy: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const suggest = useSuggestCause()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-[13px] border border-dashed border-border bg-astro-surface-2 px-5 py-5 text-left text-sm font-bold text-astro-text-muted hover:text-astro-text"
      >
        Got one? Suggest a cause &rarr;
      </button>
    )
  }

  return (
    <div className="astro-card p-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's it for?"
        className="mb-2.5 w-full rounded-[10px] border border-white/10 bg-astro-surface-2 px-3.5 py-2.5 text-sm text-astro-text placeholder:text-astro-text-dim"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A couple of lines on why"
        rows={3}
        className="mb-3 w-full resize-none rounded-[10px] border border-white/10 bg-astro-surface-2 px-3.5 py-2.5 text-sm text-astro-text placeholder:text-astro-text-dim"
      />
      <p className="mb-3 text-[11.5px] text-astro-text-dim">
        Anyone can put a cause forward. The admins set the target and the closing date.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!title.trim() || !description.trim() || suggest.isPending}
          onClick={() =>
            suggest.mutate(
              { title: title.trim(), description: description.trim(), suggestedBy },
              { onSuccess: () => setOpen(false) },
            )
          }
          className="rounded-[10px] bg-astro-green px-4 py-2.5 text-[13px] font-extrabold text-[#08130c] disabled:opacity-60"
        >
          {suggest.isPending ? 'Sending…' : 'Send it'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-astro-text-dim">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function KittyPage() {
  const { player } = useCurrentPlayer()
  const { data: duesQuarter, isLoading: duesLoading, isError: duesError, refetch: refetchDues } = useCurrentDuesQuarter()
  const { data: myDues = [] } = useDuesPayments(duesQuarter?.id)
  const { data: paidCount = 0 } = useDuesPaidCount(duesQuarter?.id)
  const { data: causes = [], isLoading: causesLoading } = useCauses()
  const { data: allPlayers = [] } = useAllPlayers()

  if (duesLoading || causesLoading) return <PageLoader />
  if (duesError) return <ErrorState onRetry={() => refetchDues()} />

  const iHavePaid = !!player && myDues.some((d) => d.player_id === player.id)
  const openCauses = causes.filter((c) => c.status === 'open')
  const metCauses = causes.filter((c) => c.status === 'met')

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Kitty</h1>
      <p className="mb-6 text-sm text-astro-text-muted">What keeps the pitch booked, and what's optional.</p>

      <div className="mb-8">
        <div className="mb-3.5 flex items-center gap-2.5">
          <div className="font-display text-2xl leading-none text-astro-text">Quarterly Dues</div>
          <div className="rounded-full border border-astro-amber/40 bg-astro-amber/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-astro-amber">
            Everyone pays
          </div>
        </div>

        {!duesQuarter ? (
          <EmptyState icon={<EmptyPitchIcon />} title="No dues quarter open yet." body="Check back once an admin opens one." />
        ) : (
          <div
            className="overflow-hidden rounded-[18px] border-2 p-7"
            style={{ background: 'linear-gradient(100deg,#2f2409 0%,#241a3f 46%,#111a33 100%)', borderColor: 'rgba(242,169,59,0.5)' }}
          >
            <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-amber">
              Q{duesQuarter.quarter} {duesQuarter.year} &middot; due {new Date(duesQuarter.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
            <div className="font-display mb-2 text-[44px] leading-none text-astro-text">{formatNaira(duesQuarter.amount)}</div>
            <p className="mb-4 text-sm text-astro-text-muted">per quarter</p>
            <div className="flex flex-wrap items-center gap-4">
              {iHavePaid ? (
                <div className="flex items-center gap-2 rounded-full border border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] px-3.5 py-2 text-[12.5px] font-extrabold text-[#4ade80]">
                  You&rsquo;re paid up for Q{duesQuarter.quarter}
                </div>
              ) : (
                <div className="rounded-full border border-border bg-astro-surface-2 px-3.5 py-2 text-[12.5px] font-extrabold text-astro-text-muted">
                  {daysUntil(duesQuarter.due_date) >= 0 ? `${daysUntil(duesQuarter.due_date)} days left` : 'Overdue'} &middot; pay an admin directly
                </div>
              )}
            </div>
            <p className="mt-4 text-[12.5px] text-astro-text-dim">
              {paidCount} of {allPlayers.length} have paid this quarter. Dues are the group&rsquo;s only fixed income, so who hasn&rsquo;t is visible to the admins, not everyone.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3.5 flex items-center gap-2.5">
          <div className="font-display text-2xl leading-none text-astro-text">Causes</div>
          <div className="rounded-full border border-astro-green/40 bg-astro-green/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-astro-green">
            Only if you want to
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {openCauses.map((c) => (
            <CauseCard key={c.id} cause={c} />
          ))}
          {player && <SuggestCauseForm suggestedBy={player.id} />}
        </div>

        {metCauses.length > 0 && (
          <div className="mt-5">
            <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">Met</div>
            <div className="grid gap-4 sm:grid-cols-2">
              {metCauses.map((c) => (
                <CauseCard key={c.id} cause={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
