import type { ConfirmOptions } from '@/components/dialogs/confirm'
import { formatNaira } from '@/features/payments/api'

export const CONFIRM_CLAIM: ConfirmOptions = {
  title: 'Claim a spot for Sunday?',
  body: 'You take one of the weekly spots now and pay before Sunday. Pull out before Wednesday 20:00 and nothing happens.',
  confirmLabel: 'Claim my spot',
}

export const CONFIRM_JOIN_STANDBY: ConfirmOptions = {
  title: 'Join standby?',
  body: 'If a spot frees up, everyone on standby hears at once and the first to claim it plays.',
  confirmLabel: 'Join standby',
}

export const CONFIRM_OPT_OUT: ConfirmOptions = {
  title: 'Sit this Sunday out?',
  body: 'Your monthly spot goes to standby for this week only, and someone can claim it straight away. The month isn’t refunded.',
  confirmLabel: 'I can’t make it',
  cancelLabel: 'I’m still in',
  tone: 'danger',
}

export const CONFIRM_CLAIM_MONTHLY: ConfirmOptions = {
  title: 'Take a monthly spot?',
  body: 'You’re in every Sunday this month. It’s one payment for the month, and a missed Sunday isn’t refunded.',
  confirmLabel: 'Take the month',
}

export const confirmPay = (kind: 'weekly' | 'monthly' | 'dues', amount: number | undefined): ConfirmOptions => ({
  title: `Pay ${amount === undefined ? '' : formatNaira(amount)}${kind === 'weekly' ? ' for Sunday' : kind === 'monthly' ? ' for the month' : ' in dues'}?`.replace('Pay  ', 'Pay '),
  body:
    kind === 'dues'
      ? 'You’ll go to Paystack to pay, then come straight back here.'
      : 'You’ll go to Paystack to pay. Your spot is held for fifteen minutes while you do.',
  confirmLabel: 'Go to Paystack',
})
