import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Scene } from '@/components/states/Scene'
import { NothingHere } from '@/components/states/NothingHere'
import { ErrorState } from '@/components/states/ErrorState'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { monthOf } from '@/features/matchday/api'
import { useNextMatchday } from '@/features/matchday/hooks'
import { formatNaira, type AdminPaymentRow, type PriceKind } from '@/features/payments/api'
import { useAdminPayments, useMarkRefunded, usePrices, useSetPrice, useSlotRoster } from '@/features/payments/hooks'

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
        save.mutate({ kind, amount }, { onSuccess: () => toast.success(`${KIND_LABEL[kind]} price saved`), onError: (err) => toast.error(err.message) })
      }}
    >
      <label className="flex-1">
        <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">{KIND_LABEL[kind]} (₦)</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="Not set"
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

export function PaymentsAdminPage() {
  const { player } = useCurrentPlayer()
  const { data: prices, isLoading, isError, refetch } = usePrices()
  const { data: payments = [] } = useAdminPayments()
  const { data: matchday } = useNextMatchday()
  const month = matchday ? monthOf(matchday.played_at) : undefined
  const { data: roster = [] } = useSlotRoster(matchday?.id, month)
  const markRefunded = useMarkRefunded()

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
        Players pay through Paystack. A spot or a quarter only shows as paid once Paystack has confirmed the money. Refunds are settled by hand.
      </p>

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
                        onClick={() => markRefunded.mutate(p.id, { onSuccess: () => toast.success(`Marked ${p.players.nickname} refunded`) })}
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
              <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                {roster.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-astro-surface-2 px-3.5 py-2">
                    <span className="truncate text-[13px] font-bold text-astro-text">{r.nickname}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
                      <span className="text-astro-text-dim">{r.kind}</span>
                      <span className={r.paid ? 'text-[#4ade80]' : 'text-astro-amber'}>{r.paid ? 'Paid' : 'Not paid'}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-astro-text-dim">Not paid means no online payment. They may have paid you in cash or by transfer.</p>
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
