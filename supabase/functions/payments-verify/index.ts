// Called when Paystack sends the player back. Checks the reference with Paystack itself, never the browser's word.
import { cors, json, serviceClient, userClient, verifyAndSettle } from '../_shared/paystack.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { reference } = await req.json().catch(() => ({}))
  if (typeof reference !== 'string' || !reference) return json({ error: 'Missing reference' }, 400)

  // Admins can read every payment, so match the payer rather than relying on RLS.
  const user = userClient(req)
  const { data: auth } = await user.auth.getUser()
  if (!auth.user) return json({ error: 'Sign in to check a payment' }, 401)
  const { data: me } = await user.from('players').select('id').eq('user_id', auth.user.id).maybeSingle()
  const { data: mine } = me
    ? await user.from('payments').select('id').eq('reference', reference).eq('player_id', me.id).maybeSingle()
    : { data: null }
  if (!mine) return json({ error: 'Payment not found' }, 404)

  try {
    const payment = await verifyAndSettle(serviceClient(), reference)
    return json({ status: payment?.status, kind: payment?.kind, note: payment?.note })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502)
  }
})
