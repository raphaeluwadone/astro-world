// Searches API-Football's player profiles (name/nationality/position/photo,
// no stats: those are a separate, per-player call, see
// pro-players-refresh-stats) and caches matches into `pro_players` keyed
// by external_id. Runs with the service role since pro_players has no
// public insert policy, only the callers of this function may write to it.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ApiFootballProfile {
  player: {
    id: number
    name: string
    nationality: string | null
    position: string | null
    photo: string | null
  }
}

Deno.serve(async (req) => {
  const { query } = await req.json().catch(() => ({ query: '' }))
  const trimmed = typeof query === 'string' ? query.trim() : ''
  if (trimmed.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } })
  }

  const apiRes = await fetch(
    `https://v3.football.api-sports.io/players/profiles?search=${encodeURIComponent(trimmed)}`,
    { headers: { 'x-apisports-key': API_FOOTBALL_KEY } },
  )
  if (!apiRes.ok) {
    return new Response(JSON.stringify({ error: 'API-Football request failed' }), { status: 502 })
  }
  const apiData = await apiRes.json()
  const profiles = ((apiData.response ?? []) as ApiFootballProfile[]).slice(0, 10)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (profiles.length === 0) {
    return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } })
  }

  const rows = profiles.map(({ player }) => ({
    external_id: String(player.id),
    name: player.name,
    nationality: player.nationality,
    role: player.position,
    photo_url: player.photo,
  }))

  const { error: upsertError } = await supabase.from('pro_players').upsert(rows, { onConflict: 'external_id' })
  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 })
  }

  const { data, error } = await supabase
    .from('pro_players')
    .select('id, name, nationality, role, apps, goals, assists')
    .in(
      'external_id',
      rows.map((r) => r.external_id),
    )
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ results: data ?? [] }), { headers: { 'Content-Type': 'application/json' } })
})
