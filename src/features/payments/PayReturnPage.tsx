import { useEffect, type ReactNode } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { Scene } from '@/components/states/Scene'
import { usePaymentReceipt, useVerifyPayment } from './hooks'
import { formatNaira, type PaymentKind, type PaymentReceipt, type PaymentStatus } from './api'
import { PaidStamp } from './PaidStamp'

type Tone = 'good' | 'wait' | 'bad'
type To = '/matchday' | '/kitty' | '/guide'

interface Copy {
  kicker: string
  title: string
  body: string
  cta: { label: string; to: To }
  more?: { label: string; to: To; search?: { c: 'draw' | 'monthly' | 'kitty' } }
}

const PAID: Record<PaymentKind, Copy> = {
  weekly: {
    kicker: 'Payment confirmed',
    title: 'YOU’RE IN FOR SUNDAY.',
    body: 'Your spot is paid and locked in. Sides are drawn Wednesday at 20:00, so check back then to see who you’re with.',
    cta: { label: 'See Matchday', to: '/matchday' },
    more: { label: 'How the draw works', to: '/guide', search: { c: 'draw' } },
  },
  monthly: {
    kicker: 'Payment confirmed',
    title: 'THE MONTH IS YOURS.',
    body: 'You’re in every Sunday this month, no weekly scramble. Can’t make one? Opt out on Matchday so standby gets the spot.',
    cta: { label: 'See Matchday', to: '/matchday' },
    more: { label: 'How the monthly ten works', to: '/guide', search: { c: 'monthly' } },
  },
  dues: {
    kicker: 'Payment confirmed',
    title: 'DUES PAID. THANK YOU.',
    body: 'You’re paid up for the quarter. It keeps the pitch booked and the bibs washed.',
    cta: { label: 'Back to the Kitty', to: '/kitty' },
    more: { label: 'Where the kitty goes', to: '/guide', search: { c: 'kitty' } },
  },
}

function copyFor(status: PaymentStatus | undefined, kind: PaymentKind, note: string | null): Copy {
  const paid = PAID[kind]
  if (status === 'paid') return paid
  const cta = paid.cta
  if (status === 'refund_due') {
    return { kicker: 'Refund due', title: 'PAID, BUT THE SPOT HAD GONE.', body: `${note ?? 'Someone got there first'}. An admin will refund you, nothing else to do.`, cta }
  }
  if (status === 'pending') {
    return { kicker: 'Checking with Paystack', title: 'ALMOST THERE.', body: 'If you finished paying, this updates on its own within a minute. You can leave this page.', cta }
  }
  return { kicker: 'Payment not taken', title: 'THAT DIDN’T GO THROUGH.', body: 'Nothing was taken from your account. Try again from the page you started on.', cta }
}

const toneOf = (s: PaymentStatus | undefined): Tone => (s === 'paid' ? 'good' : s === 'pending' ? 'wait' : 'bad')

export function PayReturnPage() {
  const { reference } = useSearch({ from: '/_app/pay/return' })
  const { player } = useCurrentPlayer()
  const { data, isLoading, isError, error } = useVerifyPayment(reference, player?.id)
  const { data: receipt } = usePaymentReceipt(reference, player?.id, data?.status)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (data?.status && data.status !== 'pending') {
      for (const key of ['payments', 'weekly-claims', 'weekly-spots-remaining', 'monthly-members', 'dues-payments', 'dues-paid-count']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    }
  }, [data?.status, queryClient])

  if (!reference) {
    return <Shell tone="bad" copy={{ kicker: 'Payment', title: 'NO PAYMENT TO CHECK.', body: 'Start a payment from Matchday or the Kitty.', cta: { label: 'See Matchday', to: '/matchday' } }} />
  }
  if (!player || isLoading) return <PageLoader />
  if (error?.message === 'Payment not found') {
    return <Shell tone="bad" copy={{ kicker: 'Payment', title: 'NOT YOUR PAYMENT.', body: 'This receipt belongs to whoever paid. Signed in as someone else? Your own payments show on Matchday and the Kitty.', cta: { label: 'See Matchday', to: '/matchday' } }} />
  }
  if (isError || !data) {
    return <Shell tone="bad" copy={{ kicker: 'Payment', title: 'WE COULDN’T CHECK THAT.', body: error?.message ?? 'Try again in a minute.', cta: { label: 'See Matchday', to: '/matchday' } }} />
  }

  const tone = toneOf(data.status)
  return (
    <Shell tone={tone} copy={copyFor(data.status, data.kind, data.note)}>
      {receipt && <Receipt receipt={receipt} tone={tone} />}
    </Shell>
  )
}

function Shell({ tone, copy, children }: { tone: Tone; copy: Copy; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-[520px] py-4 md:py-10">
      <div
        className={cn(
          'relative overflow-hidden rounded-[18px] border-[1.5px] bg-astro-surface',
          tone === 'good' ? 'border-[rgba(74,222,128,0.4)]' : tone === 'wait' ? 'border-astro-accent/40' : 'border-border',
        )}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)' }}
      >
        <div
          className="flex justify-center px-6 pb-4 pt-8"
          style={{
            background:
              tone === 'good'
                ? 'radial-gradient(120% 90% at 50% 0%, rgba(74,222,128,0.16), transparent 70%)'
                : tone === 'wait'
                  ? 'radial-gradient(120% 90% at 50% 0%, rgba(166,63,255,0.16), transparent 70%)'
                  : undefined,
          }}
        >
          {tone === 'good' ? <PaidStamp /> : tone === 'wait' ? <Scene kind="calendar" variant={1} /> : <Scene kind="goals" variant={1} />}
        </div>

        <div className="px-6 pb-7 text-center md:px-9">
          <div className={cn('mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em]', tone === 'good' ? 'text-astro-green' : 'text-astro-text-dim')} style={rise(200)}>
            {copy.kicker}
          </div>
          <h1 className="mb-3 font-display text-[38px] leading-[0.95] text-astro-text [text-wrap:balance] md:text-[44px]" style={rise(280)}>
            {copy.title}
          </h1>
          <p className="mx-auto mb-6 max-w-[42ch] text-sm leading-[1.6] text-astro-text-muted [text-wrap:pretty]" style={rise(360)}>
            {copy.body}
          </p>

          {children}

          <div className="flex flex-col items-center gap-3" style={rise(560)}>
            <Link
              to={copy.cta.to}
              className="w-full rounded-[11px] bg-astro-accent px-6 py-3.5 text-sm font-extrabold text-astro-on-accent no-underline transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              {copy.cta.label}
            </Link>
            {copy.more && (
              <Link to={copy.more.to} search={copy.more.search} className="text-[12.5px] font-bold text-astro-text-muted underline-offset-4 hover:text-astro-text hover:underline">
                {copy.more.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Receipt({ receipt, tone }: { receipt: PaymentReceipt; tone: Tone }) {
  const rows: Array<[string, ReactNode]> = [
    ['For', describe(receipt)],
    ['Amount', <span key="amount" className="font-display text-[22px] leading-none text-astro-text">{formatNaira(receipt.amount_kobo / 100)}</span>],
    [tone === 'good' ? 'Paid' : 'Started', when(receipt.paid_at ?? receipt.created_at)],
    ['Reference', <span key="ref" className="break-all font-mono text-[11px] text-astro-text-dim">{receipt.reference}</span>],
  ]

  return (
    <div className="relative mb-6 text-left" style={rise(440)}>
      <div className="rounded-[14px] border border-border bg-astro-surface-2">
        {rows.map(([k, v], i) => (
          <div key={k} className={cn('flex items-center justify-between gap-4 px-4 py-3', i > 0 && 'border-t border-dashed border-border')}>
            <span className="shrink-0 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">{k}</span>
            <span className="min-w-0 text-right text-[13px] font-bold text-astro-text">{v}</span>
          </div>
        ))}
      </div>
      {tone === 'good' && (
        <div
          className="absolute -right-2 -top-3 rotate-[8deg] rounded-[6px] border-2 border-astro-green/70 px-2 py-0.5 font-display text-[15px] leading-tight text-astro-green"
          style={{ animation: 'pay-ring 420ms cubic-bezier(.2,.8,.2,1) 760ms both' }}
        >
          PAID
        </div>
      )}
    </div>
  )
}

function describe(r: PaymentReceipt) {
  if (r.kind === 'weekly') {
    const day = r.matchdays ? new Date(r.matchdays.played_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sunday'
    return `Weekly spot · ${day}`
  }
  if (r.kind === 'monthly') {
    const month = r.month ? new Date(`${r.month}T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'this month'
    return `Monthly spot · ${month}`
  }
  return r.dues_quarters ? `Dues · Q${r.dues_quarters.quarter} ${r.dues_quarters.year}` : 'Quarterly dues'
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·')

const rise = (delay: number) => ({ animation: `gd-in 460ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` })
