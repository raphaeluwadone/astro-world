// Opens a payment for the signed-in player and returns Paystack's checkout URL.
import { cors, json, paystack, serviceClient, userClient } from '../_shared/paystack.ts'
import { serve } from '../_shared/monitoring.ts'

const RETURN_PATH = '/pay/return'

// Paystack rejects addresses on local-only domains, which every dev account uses.
function paystackEmail(email: string, playerId: string) {
  return /\.(local|test|localhost)$/i.test(email) ? `player-${playerId}@example.com` : email
}

serve('payments-start', async (req) => {
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

  const { data: who } = await user.from('players').select('nickname, full_name').eq('id', payment.player_id).maybeSingle()
  const playerName = who?.full_name || who?.nickname || auth.user.email
  const kindLabel = { weekly: 'Weekly spot', monthly: 'Monthly pass', dues: 'Dues' }[kind as 'weekly' | 'monthly' | 'dues']

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
      // Paystack's dashboard shows custom fields on each transaction, so the payer reads as a name, not an id.
      metadata: {
        custom_fields: [
          { display_name: 'Player', variable_name: 'player', value: playerName },
          ...(who?.nickname && who.nickname !== playerName ? [{ display_name: 'Nickname', variable_name: 'nickname', value: who.nickname }] : []),
          { display_name: 'Payment', variable_name: 'payment', value: kindLabel },
        ],
      },
    }),
  })
  if (!init.ok || !init.body.data) {
    await serviceClient().rpc('fail_payment', { p_reference: payment.reference, p_note: `Paystack initialize: ${init.body.message}` })
    return json({ error: 'Paystack couldn’t start the payment. Try again.' }, 502)
  }

  return json({ reference: payment.reference, authorization_url: init.body.data.authorization_url })
})
