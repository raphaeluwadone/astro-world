// Paystack's server-to-server notice. Covers players who close the tab before being sent back.
import { secretKey, serviceClient, verifyAndSettle } from '../_shared/paystack.ts'

async function signatureMatches(raw: string, signature: string | null) {
  if (!signature) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretKey()), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const raw = await req.text()
  if (!(await signatureMatches(raw, req.headers.get('x-paystack-signature')))) {
    return new Response('Bad signature', { status: 401 })
  }

  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } }
  const reference = event.data?.reference
  if (event.event !== 'charge.success' || !reference?.startsWith('astro_')) return new Response('ignored')

  try {
    await verifyAndSettle(serviceClient(), reference)
    return new Response('ok')
  } catch (e) {
    // A non-2xx makes Paystack retry later.
    return new Response(e instanceof Error ? e.message : String(e), { status: 500 })
  }
})
