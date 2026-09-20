// Backfills apps/goals/assists for one pro_players row from API-Football,
// Premier League only (league id 39, confirmed against the live API).
// The account's plan is Free, which only covers the 2022-2024 seasons
// (confirmed live: 2025 is rejected with "Free plans do not have access
// to this season"), so there's no true career total available: this
// sums across every season the plan can actually see (2022-2024) rather
// than presenting one season's number as "career". Bump SEASONS once
// the plan covers more.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PREMIER_LEAGUE_ID = 39
const SEASONS = [2022, 2023, 2024]

interface ApiFootballStats {
  league: { id: number }
  games: { appearences: number | null }
  goals: { total: number | null; assists: number | null }
}

async function fetchSeasonPlStats(externalId: string, season: number): Promise<ApiFootballStats[]> {
  const res = await fetch(`https://v3.football.api-sports.io/players?id=${externalId}&season=${season}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY },
  })
  if (!res.ok) return []
  const data = await res.json()
  const entry = data.response?.[0]
  const stats = (entry?.statistics as ApiFootballStats[] | undefined) ?? []
  // A mid-season transfer between two Premier League clubs shows up as
  // two separate league-39 entries for the same season: keep every one
  // rather than the first match, so both sides of the move count.
  return stats.filter((s) => s.league.id === PREMIER_LEAGUE_ID)
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

  const bySeasonStats = await Promise.all(SEASONS.map((season) => fetchSeasonPlStats(proPlayer.external_id!, season)))
  const allStats = bySeasonStats.flat()

  const update = {
    apps: allStats.length ? allStats.reduce((sum, s) => sum + (s.games.appearences ?? 0), 0) : null,
    goals: allStats.length ? allStats.reduce((sum, s) => sum + (s.goals.total ?? 0), 0) : null,
    assists: allStats.length ? allStats.reduce((sum, s) => sum + (s.goals.assists ?? 0), 0) : null,
    cached_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase.from('pro_players').update(update).eq('id', proPlayerId)
  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, ...update }), { headers: { 'Content-Type': 'application/json' } })
})
