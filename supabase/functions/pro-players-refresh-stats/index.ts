// Backfills apps/goals/assists for one pro_players row from API-Football,
// Premier League only (league id 39, confirmed against the live API).
// The account's plan is Free, which only covers the 2022-2024 seasons
// (confirmed live: 2025 is rejected with "Free plans do not have access
// to this season"), so this is a real historical snapshot, not current
// form. Bump SEASON once the plan covers the live season.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PREMIER_LEAGUE_ID = 39
const SEASON = 2024

interface ApiFootballStats {
  league: { id: number }
  games: { appearences: number | null }
  goals: { total: number | null; assists: number | null }
}

Deno.serve(async (req) => {
  const { proPlayerId } = await req.json().catch(() => ({ proPlayerId: null }))
  if (!proPlayerId) {
    return new Response(JSON.stringify({ error: 'proPlayerId is required' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: proPlayer, error: fetchError } = await supabase
    .from('pro_players')
    .select('id, external_id')
    .eq('id', proPlayerId)
    .maybeSingle()
  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }
  if (!proPlayer?.external_id) {
    return new Response(JSON.stringify({ error: 'Unknown pro player' }), { status: 404 })
  }

  const apiRes = await fetch(
    `https://v3.football.api-sports.io/players?id=${proPlayer.external_id}&season=${SEASON}`,
    { headers: { 'x-apisports-key': API_FOOTBALL_KEY } },
  )
  if (!apiRes.ok) {
    return new Response(JSON.stringify({ error: 'API-Football request failed' }), { status: 502 })
  }
  const apiData = await apiRes.json()
  const entry = apiData.response?.[0]
  const plStats = (entry?.statistics as ApiFootballStats[] | undefined)?.find(
    (s) => s.league.id === PREMIER_LEAGUE_ID,
  )

  const update = {
    apps: plStats?.games?.appearences ?? null,
    goals: plStats?.goals?.total ?? null,
    assists: plStats?.goals?.assists ?? null,
    cached_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase.from('pro_players').update(update).eq('id', proPlayerId)
  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, ...update }), { headers: { 'Content-Type': 'application/json' } })
})
