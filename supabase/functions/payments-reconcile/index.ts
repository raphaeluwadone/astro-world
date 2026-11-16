// Runs every 5 minutes from pg_cron, and on demand from the admin Payments page.
// Re-verifies open payments with Paystack, then sweeps Paystack's own list of successful charges for anything Astro hasn't recorded.
import { cors, json, paystack, serviceClient, userClient, verifyAndSettle, type Payment } from '../_shared/paystack.ts'

const SWEEP_DAYS = 3
const STALE_HOURS = 24

function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// verify_jwt is off because pg_cron sends no JWT, so the caller is checked here: the cron secret, or a signed-in admin.
async function isAllowed(req: Request, admin: ReturnType<typeof serviceClient>) {
  const given = req.headers.get('x-reconcile-secret')
  if (given) {
    const { data } = await admin.from('app_config').select('value').eq('key', 'payments_reconcile_secret').maybeSingle()
    if (data?.value && sameSecret(given, data.value)) return true
  }
  if (!req.headers.get('Authorization')) return false
  const { data: isAdmin } = await userClient(req).rpc('is_requesting_admin')
  return isAdmin === true
}

interface PaystackListItem {
  id: number
  reference: string
  amount: number
  currency: string
  paid_at: string | null
  customer: { email: string | null } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const admin = serviceClient()
  if (!(await isAllowed(req, admin))) return json({ error: 'Not allowed' }, 401)
  const summary ={ checked: 0, recorded: 0, expired: 0, unmatched: 0, errors: [] as string[] }

  const { data: open, error } = await admin.rpc('payments_to_reconcile', { p_limit: 25 })
  if (error) return json({ error: error.message }, 500)

  for (const p of (open ?? []) as Array<Payment & { created_at: string }>) {
    summary.checked++
    try {
      const after = await verifyAndSettle(admin, p.reference)
      if (after?.status === 'paid' || after?.status === 'refund_due') summary.recorded++
      else if (after?.status === 'pending' && Date.now() - new Date(p.created_at).getTime() > STALE_HOURS * 3600_000) {
        await admin.rpc('fail_payment', { p_reference: p.reference, p_note: `Nothing reached Paystack within ${STALE_HOURS} hours` })
        summary.expired++
      }
    } catch (e) {
      summary.errors.push(`${p.reference}: ${e instanceof Error ? e.message : e}`)
    }
  }

  try {
    summary.unmatched = await sweepPaystack(admin, summary)
  } catch (e) {
    summary.errors.push(`sweep: ${e instanceof Error ? e.message : e}`)
  }

  if (summary.errors.length) console.error('payments-reconcile', summary.errors)
  return json(summary)
})

async function sweepPaystack(admin: ReturnType<typeof serviceClient>, summary: { recorded: number }) {
  const from = new Date(Date.now() - SWEEP_DAYS * 86400_000).toISOString()
  let unmatched = 0
  for (let page = 1; page <= 10; page++) {
    const res = await paystack<PaystackListItem[]>(`/transaction?status=success&from=${from}&perPage=100&page=${page}`)
    if (!res.ok) throw new Error(`Paystack ${res.status}: ${res.body.message}`)
    const txs = (res.body.data ?? []).filter((t) => t.reference.startsWith('astro_'))

    const refs = txs.map((t) => t.reference)
    const { data: known, error } = await admin.from('payments').select('reference, status, note').in('reference', refs.length ? refs : [''])
    if (error) throw error
    const byRef = new Map((known ?? []).map((p) => [p.reference, p]))

    for (const tx of txs) {
      let payment = byRef.get(tx.reference)
      if (payment && !['paid', 'refund_due', 'refunded'].includes(payment.status)) {
        const after = await verifyAndSettle(admin, tx.reference)
        if (after) payment = { reference: after.reference, status: after.status, note: after.note }
        if (after?.status === 'paid' || after?.status === 'refund_due') summary.recorded++
      }
      if (payment && ['paid', 'refund_due', 'refunded'].includes(payment.status)) continue

      const reason = !payment
        ? 'Paystack took this payment but Astro has no record of it'
        : payment.note ?? `Paystack took this payment but Astro has it as ${payment.status}`
      await admin.rpc('record_paystack_unmatched', {
        p_provider_ref: String(tx.id),
        p_reference: tx.reference,
        p_amount_kobo: tx.amount,
        p_currency: tx.currency,
        p_customer_email: tx.customer?.email ?? null,
        p_paid_at: tx.paid_at,
        p_reason: reason,
      })
      unmatched++
    }
    if ((res.body.data ?? []).length < 100) break
  }
  return unmatched
}
