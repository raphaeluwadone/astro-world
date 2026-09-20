// Searches API-Football's teams (name, country, crest) and caches
// matches into pro_clubs keyed by external_id. Team search isn't
// season-gated the way player statistics are (confirmed live), so this
// works the same regardless of the account's plan.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ApiFootballTeam {
  team: {
    id: number
    name: string
    country: string | null
    logo: string | null
  }
}

Deno.serve(async (req) => {
  const { query } = await req.json().catch(() => ({ query: '' }))
  const trimmed = typeof query === 'string' ? query.trim() : ''
  if (trimmed.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } })
  }

  const apiRes = await fetch(`https://v3.football.api-sports.io/teams?search=${encodeURIComponent(trimmed)}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY },
  })
  if (!apiRes.ok) {
    return new Response(JSON.stringify({ error: 'API-Football request failed' }), { status: 502 })
  }
  const apiData = await apiRes.json()
  const teams = ((apiData.response ?? []) as ApiFootballTeam[]).slice(0, 10)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (teams.length === 0) {
    return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } })
  }

  const rows = teams.map(({ team }) => ({
    external_id: String(team.id),
    name: team.name,
    country: team.country,
    logo_url: team.logo,
  }))

  const { error: upsertError } = await supabase.from('pro_clubs').upsert(rows, { onConflict: 'external_id' })
  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 })
  }

  const { data, error } = await supabase
    .from('pro_clubs')
    .select('id, name, country, logo_url')
    .in(
      'external_id',
      rows.map((r) => r.external_id),
    )
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ results: data ?? [] }), { headers: { 'Content-Type': 'application/json' } })
})
