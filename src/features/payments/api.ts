import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentKind = Database['public']['Enums']['payment_kind']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PriceKind = Extract<PaymentKind, 'weekly' | 'monthly'>

export type PaymentTarget =
  | { kind: 'weekly'; matchday_id: string }
  | { kind: 'monthly'; month: string }
  | { kind: 'dues'; dues_quarter_id: string }

export interface AdminPaymentRow extends Payment {
  players: { nickname: string }
}

async function functionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    if (body?.error) return new Error(body.error)
  }
  return error instanceof Error ? error : new Error(String(error))
}

/** Opens a payment server-side, then sends the player to Paystack's checkout. */
export async function startPayment(target: PaymentTarget) {
  const { data, error } = await supabase.functions.invoke<{ authorization_url: string; reference: string }>('payments-start', { body: target })
  if (error) throw await functionError(error)
  window.location.assign(data!.authorization_url)
}

export async function verifyPayment(reference: string) {
  const { data, error } = await supabase.functions.invoke<{ status: PaymentStatus; kind: PaymentKind; note: string | null }>('payments-verify', { body: { reference } })
  if (error) throw await functionError(error)
  return data!
}

export async function fetchPrices(): Promise<Partial<Record<PriceKind, number>>> {
  const { data, error } = await supabase.from('payment_prices').select('kind, amount')
  if (error) throw error
  return Object.fromEntries((data ?? []).map((p) => [p.kind, Number(p.amount)]))
}

export async function setPrice(kind: PriceKind, amount: number, updatedBy: string) {
  const { error } = await supabase
    .from('payment_prices')
    .upsert({ kind, amount, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'kind' })
  if (error) throw error
}

/** The signed-in player's own payments; RLS hides everyone else's unless you're an admin. */
export async function fetchMyPayments(playerId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function fetchAdminPayments(): Promise<AdminPaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, players!payments_player_id_fkey (nickname)')
    .in('status', ['paid', 'refund_due', 'refunded'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as unknown as AdminPaymentRow[]
}

export interface SlotRosterRow {
  id: string
  nickname: string
  kind: PriceKind
  paid: boolean
}

/** Everyone holding a spot for this Sunday, and whether a verified payment backs it. Admin only. */
export async function fetchSlotRoster(matchdayId: string, month: string): Promise<SlotRosterRow[]> {
  const [weekly, monthly, paid] = await Promise.all([
    supabase.from('weekly_claims').select('id, claimed_at, players (nickname)').eq('matchday_id', matchdayId).order('claimed_at'),
    supabase.from('monthly_memberships').select('id, claimed_at, players (nickname)').eq('month', month).order('claimed_at'),
    supabase.from('payments').select('weekly_claim_id, monthly_membership_id').eq('status', 'paid').or(`matchday_id.eq.${matchdayId},month.eq.${month}`),
  ])
  for (const r of [weekly, monthly, paid]) if (r.error) throw r.error
  const paidIds = new Set((paid.data ?? []).flatMap((p) => [p.weekly_claim_id, p.monthly_membership_id]))
  const rows = (kind: PriceKind, data: Array<{ id: string; players: { nickname: string } | null }> | null) =>
    (data ?? []).map((c) => ({ id: c.id, nickname: c.players?.nickname ?? 'Unknown', kind, paid: paidIds.has(c.id) }))
  return [...rows('monthly', monthly.data), ...rows('weekly', weekly.data)]
}

export async function markRefunded(paymentId: string) {
  const { error } = await supabase.rpc('mark_payment_refunded', { p_payment_id: paymentId })
  if (error) throw error
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

export const isActiveHold = (p: Payment) => p.status === 'pending' && !!p.hold_until && new Date(p.hold_until) > new Date()

export interface PaymentReceipt {
  kind: PaymentKind
  status: PaymentStatus
  amount_kobo: number
  paid_at: string | null
  created_at: string
  reference: string
  month: string | null
  matchdays: { played_at: string } | null
  dues_quarters: { quarter: number; year: number } | null
}

export async function fetchPaymentReceipt(reference: string): Promise<PaymentReceipt | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('kind, status, amount_kobo, paid_at, created_at, reference, month, matchdays (played_at), dues_quarters (quarter, year)')
    .eq('reference', reference)
    .maybeSingle()
  if (error) throw error
  return data as PaymentReceipt | null
}
