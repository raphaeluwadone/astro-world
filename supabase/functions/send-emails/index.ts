// Drains email_outbox. Sends through Resend when RESEND_API_KEY is set, otherwise into the local Mailpit inbox.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildTicket, renderTicket } from '../_shared/email.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = Deno.env.get('EMAIL_FROM') ?? 'Astro <hello@astro.football>'
const MAILPIT_URL = Deno.env.get('MAILPIT_URL') ?? 'http://supabase_inbucket_astro:8025'

async function send(to: string, subject: string, html: string) {
  if (RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    return
  }
  const [, name = 'Astro', address = FROM] = FROM.match(/^(.*?)\s*<(.+)>$/) ?? []
  const res = await fetch(`${MAILPIT_URL}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ From: { Email: address, Name: name }, To: [{ Email: to }], Subject: subject, HTML: html }),
  })
  if (!res.ok) throw new Error(`Mailpit ${res.status}: ${await res.text()}`)
}

Deno.serve(async () => {
  const { data: batch, error } = await supabase.rpc('claim_email_batch', { p_limit: 20 })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const row of batch ?? []) {
    try {
      const ticket = buildTicket(row.template, row.data)
      if (!ticket) throw new Error(`Unknown template or badge: ${row.template}`)
      await send(row.to_email, ticket.subject, renderTicket(ticket))
      await supabase.rpc('finish_email', { p_id: row.id })
      sent++
    } catch (e) {
      await supabase.rpc('finish_email', { p_id: row.id, p_error: String(e instanceof Error ? e.message : e) })
    }
  }
  return Response.json({ claimed: batch?.length ?? 0, sent })
})
