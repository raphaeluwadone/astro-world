// Paystack helpers shared by payments-start, payments-verify and paystack-webhook.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const BASE_URL = Deno.env.get('PAYSTACK_BASE_URL') ?? 'https://api.paystack.co'

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors })
}

export function secretKey() {
  const key = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

export function userClient(req: Request) {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
}

export async function paystack<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: { status: boolean; message: string; data: T } }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json', ...init.headers },
  })
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({ status: false, message: res.statusText, data: null })) }
}

interface PaystackTransaction {
  id: number
  status: 'success' | 'failed' | 'reversed' | 'abandoned' | 'ongoing' | 'pending' | 'processing' | 'queued'
  reference: string
  amount: number
  currency: string
}

/** Asks Paystack for the truth about a reference and settles it. Safe to repeat. */
export async function verifyAndSettle(admin: SupabaseClient, reference: string) {
  const res = await paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
  const tx = res.body.data
  // Paystack answers 400 for a reference nobody has paid against yet.
  if (!res.ok || !tx) {
    if (res.status >= 500) throw new Error(`Paystack ${res.status}: ${res.body.message}`)
    return currentPayment(admin, reference)
  }
  if (tx.reference !== reference) throw new Error('Paystack returned a different reference')

  if (tx.status === 'success') {
    const { data, error } = await admin.rpc('settle_payment', {
      p_reference: reference,
      p_amount_kobo: tx.amount,
      p_currency: tx.currency,
      p_provider_ref: String(tx.id),
    })
    if (error) throw error
    return data as Payment
  }
  if (tx.status === 'failed' || tx.status === 'reversed') {
    await admin.rpc('fail_payment', { p_reference: reference, p_note: `Paystack: ${tx.status}` })
  }
  return currentPayment(admin, reference)
}

export interface Payment {
  id: string
  reference: string
  kind: 'weekly' | 'monthly' | 'dues'
  player_id: string
  status: string
  note: string | null
}

async function currentPayment(admin: SupabaseClient, reference: string) {
  const { data, error } = await admin.from('payments').select('*').eq('reference', reference).maybeSingle()
  if (error) throw error
  return data as Payment | null
}
