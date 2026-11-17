import { digitsOnly, withCommas } from '@/lib/numbers'
import { withConfirm } from '@/components/dialogs/confirm'
import { useState, type ReactNode } from 'react'
import { AstroSelect } from '@/components/ui/astro-select'
import { useAllPlayers } from '@/features/kitty/hooks'
import { toast } from 'sonner'
import { Scene } from '@/components/states/Scene'
import { NothingHere } from '@/components/states/NothingHere'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { monthOf } from '@/features/matchday/api'
import { useNextMatchday } from '@/features/matchday/hooks'
import { formatDeadline, payDeadline } from '@/features/matchday/payDeadline'
import { formatNaira, type AdminPaymentRow, type PriceKind, type UnmatchedPayment } from '@/features/payments/api'
import {
  useAddToMatchday,
  useAdminPayments,
  useMarkRefunded,
  useMarkSpotPaid,
  usePrices,
  useReconcileNow,
  useResolveUnmatched,
  useSetPrice,
  useSlotRoster,
  useUnmatched,
} from '@/features/payments/hooks'

const KIND_LABEL = { weekly: 'Weekly spot', monthly: 'Monthly spot', dues: 'Dues' } as const

const naira = (kobo: number) => formatNaira(kobo / 100)
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function PriceField({ kind, current, updatedBy }: { kind: PriceKind; current: number | undefined; updatedBy: string }) {
  const [value, setValue] = useState(current ? String(current) : '')
  const save = useSetPrice(updatedBy)
  const amount = Number(value)
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        withConfirm({ tone: 'admin', eyebrow: 'Prices', title: `Set the ${KIND_LABEL[kind].toLowerCase()} to ${formatNaira(amount)}?`, body: 'Payments started from now on use this price. Anything already paid keeps its amount.', confirmLabel: 'Set price' }, () => save.mutate({ kind, amount }, { onSuccess: () => toast.success(`${KIND_LABEL[kind]} price saved`), onError: (err) => toast.error(err.message) }))
      }}
    >
      <label className="flex-1">
        <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">{KIND_LABEL[kind]} (₦)</span>
        <input
          inputMode="numeric"
          value={withCommas(value)}
          onChange={(e) => setValue(digitsOnly(e.target.value))}
          placeholder="Not set, e.g. 3,000"
          className="h-10 w-full rounded-[10px] border border-border bg-astro-surface-2 px-3 text-sm text-astro-text placeholder:text-astro-text-dim"
        />
      </label>
      <button
        type="submit"
        disabled={!amount || amount === current || save.isPending}
        className="h-10 rounded-[10px] bg-astro-accent px-4 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-50"
      >
        Save
      </button>
    </form>
  )
}

function PaymentLine({ p, action }: { p: AdminPaymentRow; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-astro-surface-2 px-3.5 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-astro-text">
          {p.players.nickname} &middot; {KIND_LABEL[p.kind]}
        </span>
        <span className="block text-[11.5px] text-astro-text-dim">
          {naira(p.amount_kobo)} &middot; {shortDate(p.paid_at ?? p.created_at)}
          {p.note ? ` · ${p.note}` : ''}
        </span>
      </span>
      {action}
    </div>
  )
}

function AddToSunday({ matchdayId }: { matchdayId: string }) {
  const { data: players = [] } = useAllPlayers()
  const add = useAddToMatchday()
  const [playerId, setPlayerId] = useState('')
  const [waive, setWaive] = useState(true)
  const name = players.find((p) => p.id === playerId)?.nickname ?? ''
  return (
    <div className="mb-4 rounded-lg border border-white/[0.08] p-3.5">
      <div className="mb-2 text-[13px] font-extrabold text-astro-text">Add a player to this Sunday</div>
      <AstroSelect
        value={playerId}
        onValueChange={setPlayerId}
        options={players.map((p) => ({ value: p.id, label: p.nickname }))}
        placeholder="Choose a player"
        aria-label="Player to add"
      />
      <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-astro-text-muted">
        <input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} className="size-4 accent-astro-cyan" />
        Waive the payment
      </label>
      <p className="mt-1 text-[11.5px] text-astro-text-dim">
        They get a spot even if every spot is taken. {waive ? 'Nothing is charged and the spot is never dropped for non-payment.' : 'They still have to pay by the deadline.'}
      </p>
      <button
        type="button"
        disabled={!playerId || add.isPending}
        onClick={() =>
          withConfirm(
            { tone: 'admin', eyebrow: 'Payments', title: `Add ${name} to this Sunday?`, body: waive ? 'Their payment is waived. If every spot is taken, the Sunday goes over its spots. They are told they are in.' : 'They hold a spot but still pay by the deadline. They are told they are in.', confirmLabel: 'Add them' },
            () => add.mutate({ matchdayId, playerId, waive }, { onSuccess: () => { toast.success(`${name} added`); setPlayerId('') } }),
          )
        }
        className="mt-3 h-10 rounded-[10px] bg-astro-accent px-4 text-[13px] font-extrabold text-astro-on-accent disabled:opacity-50"
      >
        Add to Sunday
      </button>
    </div>
  )
}

function UnmatchedRow({ u }: { u: UnmatchedPayment }) {
  const [resolving, setResolving] = useState(false)
  const [note, setNote] = useState('')
  const resolve = useResolveUnmatched()
  return (
    <div className="rounded-lg border border-astro-amber/30 bg-astro-surface-2 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-astro-text">
            {naira(u.amount_kobo)} &middot; {u.customer_email ?? 'No email'}
          </span>
          <span className="block text-[11.5px] text-astro-text-dim">
            {u.paid_at ? shortDate(u.paid_at) : 'Unknown date'} &middot; {u.reason} &middot; {u.reference}
          </span>
        </span>
        {!resolving && (
          <button
            type="button"
            onClick={() => setResolving(true)}
            className="rounded-md border border-border bg-astro-surface px-2.5 py-1 text-[11px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            Resolve
          </button>
        )}
      </div>
      {resolving && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            resolve.mutate({ id: u.id, note }, { onSuccess: () => toast.success('Marked resolved') })
          }}
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you did, e.g. refunded in Paystack"
            className="h-9 min-w-0 flex-1 rounded-[10px] border border-border bg-astro-surface px-3 text-xs text-astro-text placeholder:text-astro-text-dim"
          />
          <button type="submit" disabled={resolve.isPending} className="h-9 rounded-[10px] bg-astro-accent px-3 text-xs font-extrabold text-astro-on-accent disabled:opacity-60">
            Save
          </button>
        </form>
      )}
    </div>
  )
}

export function PaymentsAdminPage() {
  const { player } = useCurrentPlayer()
  const { data: prices, isLoading, isError, refetch } = usePrices()
  const { data: payments = [] } = useAdminPayments()
  const { data: matchday } = useNextMatchday()
  const month = matchday ? monthOf(matchday.played_at) : undefined
  const { data: roster = [] } = useSlotRoster(matchday?.id, month)
  const markRefunded = useMarkRefunded()
  const markSpotPaid = useMarkSpotPaid()
  const { data: unmatched = [] } = useUnmatched()
  const reconcile = useReconcileNow()

  if (isLoading) return <PageLoader />
  if (isError || !prices) return <ErrorState onRetry={() => refetch()} />
  if (!player) return null

  const refundsDue = payments.filter((p) => p.status === 'refund_due')
  const settled = payments.filter((p) => p.status !== 'refund_due')
  const unpaid = roster.filter((r) => !r.paid)

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Money</div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">Payments</h1>
      <p className="mb-6 max-w-lg text-sm text-astro-text-muted">
        Players pay through Paystack. A spot or a quarter only shows as paid once Paystack has confirmed the money. Astro re-checks with Paystack every 5 minutes, so a payment is recorded even if the player closed the tab. Refunds are settled by hand.
      </p>

      <div className="astro-card mb-5 p-6" style={unmatched.length ? { borderColor: 'rgba(242,169,59,0.5)' } : undefined}>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-2xl leading-none text-astro-text">Paystack has, Astro doesn&rsquo;t</div>
            <p className="mt-1 text-[12px] text-astro-text-dim">Money Paystack took that Astro couldn&rsquo;t match to a spot or quarter.</p>
          </div>
          <button
            type="button"
            disabled={reconcile.isPending}
            onClick={() => reconcile.mutate()}
            className="rounded-[10px] border border-border bg-astro-surface-2 px-3.5 py-2 text-[12.5px] font-extrabold text-astro-text disabled:opacity-60"
          >
            {reconcile.isPending ? 'Checking…' : 'Check with Paystack now'}
          </button>
        </div>
        {unmatched.length === 0 ? (
          <NothingHere compact icon={<Scene kind="kitty" />} title="All clear" body="Everything Paystack took is recorded." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {unmatched.map((u) => (
              <UnmatchedRow key={u.id} u={u} />
            ))}
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="astro-card flex flex-col gap-3.5 p-6">
            <div className="font-display text-2xl leading-none text-astro-text">Prices</div>
            <PriceField kind="weekly" current={prices.weekly} updatedBy={player.id} />
            <PriceField kind="monthly" current={prices.monthly} updatedBy={player.id} />
            <p className="text-[11.5px] text-astro-text-dim">Dues use the quarter&rsquo;s own amount, set on the Dues page. With no price set, players can only claim for free.</p>
          </div>

          <div className="astro-card p-6">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <div className="font-display text-2xl leading-none text-astro-text">Refunds due</div>
              <div className="text-[13px] text-astro-text-muted">{refundsDue.length}</div>
            </div>
            {refundsDue.length === 0 ? (
              <NothingHere compact icon={<Scene kind="kitty" />} body="Nobody is owed money." />
            ) : (
              <div className="flex flex-col gap-1.5">
                {refundsDue.map((p) => (
                  <PaymentLine
                    key={p.id}
                    p={p}
                    action={
                      <button
                        type="button"
                        disabled={markRefunded.isPending}
                        onClick={() =>
                          withConfirm(
                            { tone: 'admin', eyebrow: 'Refunds', title: `Mark ${p.players.nickname} refunded?`, body: `Only do this once the ${formatNaira(p.amount_kobo / 100)} is back with them. It comes off the refunds list.`, confirmLabel: 'Mark refunded' },
                            () => markRefunded.mutate(p.id, { onSuccess: () => toast.success(`Marked ${p.players.nickname} refunded`) }),
                          )
                        }
                        className="rounded-md border border-border bg-astro-surface px-2.5 py-1 text-[11px] font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-60"
                      >
                        Mark refunded
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {matchday && (
            <div className="astro-card p-6">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="font-display text-2xl leading-none text-astro-text">
                  Sunday {shortDate(matchday.played_at)}
                </div>
                <div className="text-[13px] text-astro-text-muted">
                  {roster.length - unpaid.length} of {roster.length} paid in the app
                </div>
              </div>
              <AddToSunday matchdayId={matchday.id} />
              <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                {roster.length === 0 && <NothingHere compact icon={<Scene kind="bench" />} title="Nobody has a spot yet" body="Players show up here as they claim a spot." />}
                {roster.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-astro-surface-2 px-3.5 py-2">
                    <span className="truncate text-[13px] font-bold text-astro-text">{r.nickname}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
                      <span className="text-astro-text-dim">{r.kind}</span>
                      <span className={r.paid ? 'text-[#4ade80]' : 'text-astro-amber'}>{r.waived ? 'Waived' : r.paid ? 'Paid' : 'Not paid'}</span>
                      {!r.paid && prices[r.kind] !== undefined && (
                        <button
                          type="button"
                          disabled={markSpotPaid.isPending}
                          onClick={() =>
                            withConfirm(
                              { tone: 'admin', eyebrow: 'Payments', title: `Mark ${r.nickname} paid?`, body: `Only once you have the ${formatNaira(prices[r.kind]!)} in cash or by transfer. Their spot then stays after the deadline.`, confirmLabel: 'Mark paid' },
                              () => markSpotPaid.mutate({ kind: r.kind, id: r.id }, { onSuccess: () => toast.success(`Marked ${r.nickname} paid`) }),
                            )
                          }
                          className="rounded-md border border-border bg-astro-surface px-2 py-0.5 text-[10.5px] font-bold normal-case tracking-normal text-astro-text-muted hover:text-astro-text disabled:opacity-60"
                        >
                          Mark paid
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-astro-text-dim">
                Not paid means no online payment. If they paid you in cash or by transfer, mark them paid. Unpaid spots are dropped at {formatDeadline(payDeadline(matchday.played_at))} and go to standby.
              </p>
            </div>
          )}

          <div className="astro-card p-6">
            <div className="mb-3.5 font-display text-2xl leading-none text-astro-text">Recent payments</div>
            {settled.length === 0 ? (
              <NothingHere compact icon={<Scene kind="kitty" />} body="No online payments yet." />
            ) : (
              <div className="flex flex-col gap-1.5">
                {settled.map((p) => (
                  <PaymentLine
                    key={p.id}
                    p={p}
                    action={p.status === 'refunded' && <span className="text-[11px] font-extrabold uppercase text-astro-text-dim">Refunded</span>}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
