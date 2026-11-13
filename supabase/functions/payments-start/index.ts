// Opens a payment for the signed-in player and returns Paystack's checkout URL.
import { cors, json, paystack, serviceClient, userClient } from '../_shared/paystack.ts'

const RETURN_PATH = '/pay/return'

// Paystack rejects addresses on local-only domains, which every dev account uses.
function paystackEmail(email: string, playerId: string) {
  return /\.(local|test|localhost)$/i.test(email) ? `player-${playerId}@example.com` : email
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { kind, matchday_id, month, dues_quarter_id } = await req.json().catch(() => ({}))
  if (!['weekly', 'monthly', 'dues'].includes(kind)) return json({ error: 'Unknown payment' }, 400)

  const user = userClient(req)
  const { data: auth } = await user.auth.getUser()
  if (!auth.user?.email) return json({ error: 'Sign in to pay' }, 401)

  const { data: payment, error } = await user
    .rpc('start_payment', {
      p_kind: kind,
      p_matchday_id: matchday_id ?? null,
      p_month: month ?? null,
      p_dues_quarter_id: dues_quarter_id ?? null,
    })
    .single<{ id: string; reference: string; amount_kobo: number; player_id: string }>()
  if (error) return json({ error: error.message }, 400)

  // APP_URL pins the callback in production, so a caller can't redirect players elsewhere.
  const appUrl = Deno.env.get('APP_URL') ?? req.headers.get('origin') ?? 'http://localhost:5175'
  const init = await paystack<{ authorization_url: string; access_code: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: paystackEmail(auth.user.email, payment.player_id),
      amount: String(payment.amount_kobo),
      currency: 'NGN',
      reference: payment.reference,
      callback_url: `${appUrl}${RETURN_PATH}`,
      metadata: { payment_id: payment.id, player_id: payment.player_id, kind },
    }),
  })
  if (!init.ok || !init.body.data) {
    await serviceClient().rpc('fail_payment', { p_reference: payment.reference, p_note: `Paystack initialize: ${init.body.message}` })
    return json({ error: 'Paystack couldn’t start the payment. Try again.' }, 502)
  }

  return json({ reference: payment.reference, authorization_url: init.body.data.authorization_url })
})
