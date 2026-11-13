// Called when Paystack sends the player back. Checks the reference with Paystack itself, never the browser's word.
import { cors, json, serviceClient, userClient, verifyAndSettle } from '../_shared/paystack.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { reference } = await req.json().catch(() => ({}))
  if (typeof reference !== 'string' || !reference) return json({ error: 'Missing reference' }, 400)

  const { data: mine } = await userClient(req).from('payments').select('id').eq('reference', reference).maybeSingle()
  if (!mine) return json({ error: 'Payment not found' }, 404)

  try {
    const payment = await verifyAndSettle(serviceClient(), reference)
    return json({ status: payment?.status, kind: payment?.kind, note: payment?.note })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502)
  }
})
