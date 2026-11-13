import { useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoader } from '@/components/states/PageLoader'
import { useVerifyPayment } from './hooks'
import type { PaymentKind, PaymentStatus } from './api'

const DONE: Record<PaymentKind, { title: string; body: string; to: '/matchday' | '/kitty'; cta: string }> = {
  weekly: { title: 'Paid. You’re in.', body: 'Your Sunday spot is confirmed.', to: '/matchday', cta: 'Back to the ballot' },
  monthly: { title: 'Paid. The month is yours.', body: 'You hold a monthly spot for every Sunday this month.', to: '/matchday', cta: 'Back to the ballot' },
  dues: { title: 'Dues paid.', body: 'You’re paid up for the quarter. Thank you.', to: '/kitty', cta: 'Back to the kitty' },
}

function copyFor(status: PaymentStatus | undefined, kind: PaymentKind, note: string | null) {
  if (status === 'paid') return DONE[kind]
  const back = DONE[kind]
  if (status === 'refund_due') {
    return { ...back, title: 'Payment received, but no spot.', body: `${note ?? 'The spot had gone'}. An admin will refund you.` }
  }
  if (status === 'pending') {
    return { ...back, title: 'Still waiting on Paystack.', body: 'If you finished paying, this updates on its own within a minute. You can leave this page.' }
  }
  return { ...back, title: 'That payment didn’t go through.', body: 'Nothing was taken. Try again from the page you started on.' }
}

export function PayReturnPage() {
  const { reference } = useSearch({ from: '/_app/pay/return' })
  const { data, isLoading, isError, error } = useVerifyPayment(reference)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (data?.status && data.status !== 'pending') {
      for (const key of ['payments', 'weekly-claims', 'weekly-spots-remaining', 'monthly-members', 'dues-payments', 'dues-paid-count']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    }
  }, [data?.status, queryClient])

  if (!reference) return <Message title="No payment to check." body="Start a payment from the ballot or the kitty." to="/matchday" cta="Back to the ballot" />
  if (isLoading) return <PageLoader />
  if (isError || !data) return <Message title="We couldn’t check that payment." body={error?.message ?? 'Try again in a minute.'} to="/matchday" cta="Back to the ballot" />

  const copy = copyFor(data.status, data.kind, data.note)
  return <Message {...copy} tone={data.status === 'paid' ? 'good' : data.status === 'pending' ? 'wait' : 'bad'} />
}

function Message({ title, body, to, cta, tone = 'bad' }: { title: string; body: string; to: '/matchday' | '/kitty'; cta: string; tone?: 'good' | 'wait' | 'bad' }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">Payment</div>
      <h1 className={tone === 'good' ? 'mb-2 font-display text-[40px] leading-[0.95] text-astro-green' : 'mb-2 font-display text-[40px] leading-[0.95] text-astro-text'}>
        {title}
      </h1>
      <p className="mb-6 text-sm text-astro-text-muted [text-wrap:pretty]">{body}</p>
      <Link to={to} className="inline-block rounded-[11px] bg-astro-accent px-5 py-3 text-[13px] font-extrabold text-astro-on-accent no-underline">
        {cta}
      </Link>
    </div>
  )
}
