import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Player = Database['public']['Tables']['players']['Row']

export interface MatchRatingRow {
  match_id: string
  played_at: string
  avg_rating: number
}

export interface MatchHistoryRow extends MatchRatingRow {
  team_a: { greek_name: string; colour: string }
  team_b: { greek_name: string; colour: string }
  score_a: number
  score_b: number
}

export interface PlayerTagRow {
  id: string
  source: Database['public']['Enums']['tag_source']
  label: string
}

export interface PlayerAwardRow {
  id: string
  award_name: string
  year: number
  month: number
  stat: string
}

export interface ComparisonRow {
  id: string
  source: Database['public']['Enums']['comparison_source']
  pro: {
    name: string
    nationality: string | null
    role: string | null
    photo_url: string | null
    apps: number | null
    goals: number | null
    assists: number | null
  }
  upvotes: number
  downvotes: number
  myVote: 'up' | 'down' | null
}

export interface ProPlayerRow {
  id: string
  name: string
  nationality: string | null
  role: string | null
  photo_url: string | null
  apps: number | null
  goals: number | null
  assists: number | null
}

export async function fetchPlayer(playerId: string): Promise<Player | null> {
  // maybeSingle, not single: a stale or mistyped playerId is a normal
  // "not found" outcome, not a server error (single() 406s on zero rows).
  const { data, error } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchMatchRatings(playerId: string): Promise<MatchRatingRow[]> {
  const { data, error } = await supabase.rpc('player_match_ratings', { p_player_id: playerId })
  if (error) throw error
  return data ?? []
}

export async function fetchAppearanceCount(playerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('match_players')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId)
  if (error) throw error
  return count ?? 0
}

export async function fetchGoalsAndAssists(
  playerId: string,
): Promise<{ goals: number; assists: number }> {
  const [goals, assists] = await Promise.all([
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('scorer_id', playerId),
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('assist_id', playerId),
  ])
  if (goals.error) throw goals.error
  if (assists.error) throw assists.error
  return { goals: goals.count ?? 0, assists: assists.count ?? 0 }
}

/** How many matchdays this player has actually won MOTM (most nominations). */
export async function fetchMotmCount(playerId: string): Promise<number> {
  const { data, error } = await supabase.rpc('matchday_motm_summary')
  if (error) throw error
  const byMatchday = new Map<string, { nominee_id: string; vote_count: number }>()
  for (const row of data ?? []) {
    const current = byMatchday.get(row.matchday_id)
    if (!current || row.vote_count > current.vote_count) {
      byMatchday.set(row.matchday_id, row)
    }
  }
  return [...byMatchday.values()].filter((w) => w.nominee_id === playerId).length
}

/** Real award history, not the computed badges in Achievements: these are
 * facts scraped from the group's own almanac, never re-derived. */
export async function fetchPlayerAwards(playerId: string): Promise<PlayerAwardRow[]> {
  const { data, error } = await supabase
    .from('monthly_awards')
    .select('id, award_name, year, month, stat')
    .eq('player_id', playerId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchMatchHistory(playerId: string): Promise<MatchHistoryRow[]> {
  const ratings = await fetchMatchRatings(playerId)
  if (ratings.length === 0) return []
  const matchIds = ratings.map((r) => r.match_id)
  const { data: matches, error } = await supabase
    .from('matches')
    .select(
      `id, score_a, score_b,
       team_a:teams!matches_team_a_id_fkey (greek_name, colour),
       team_b:teams!matches_team_b_id_fkey (greek_name, colour)`,
    )
    .in('id', matchIds)
  if (error) throw error
  const matchById = new Map((matches ?? []).map((m) => [m.id, m]))
  return ratings
    .map((r) => {
      const m = matchById.get(r.match_id) as unknown as {
        score_a: number
        score_b: number
        team_a: { greek_name: string; colour: string }
        team_b: { greek_name: string; colour: string }
      }
      return m ? { ...r, ...m } : null
    })
    .filter((r): r is MatchHistoryRow => r !== null)
}

export async function fetchPlayerTags(playerId: string): Promise<PlayerTagRow[]> {
  const { data, error } = await supabase
    .from('player_tags')
    .select('id, source, tags (label)')
    .eq('player_id', playerId)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    source: row.source,
    label: (row.tags as unknown as { label: string }).label,
  }))
}

export interface LastDroppedRow {
  name: string
  droppedAt: string
}

export async function fetchComparisons(playerId: string, viewerId?: string): Promise<ComparisonRow[]> {
  const { data: comparisons, error } = await supabase
    .from('player_comparisons')
    .select('id, source, pro_players (name, nationality, role, photo_url, apps, goals, assists)')
    .eq('player_id', playerId)
    .is('dropped_at', null)
  if (error) throw error
  if (!comparisons || comparisons.length === 0) return []

  const { data: votes, error: votesError } = await supabase
    .from('comparison_votes')
    .select('comparison_id, voter_id, direction')
    .in(
      'comparison_id',
      comparisons.map((c) => c.id),
    )
  if (votesError) throw votesError

  return comparisons.map((c) => ({
    id: c.id,
    source: c.source,
    pro: c.pro_players as unknown as ComparisonRow['pro'],
    upvotes: (votes ?? []).filter((v) => v.comparison_id === c.id && v.direction === 'up').length,
    downvotes: (votes ?? []).filter((v) => v.comparison_id === c.id && v.direction === 'down').length,
    myVote: (votes ?? []).find((v) => v.comparison_id === c.id && v.voter_id === viewerId)?.direction ?? null,
  }))
}

// Powers the empty-slot copy ("Bruno got voted off on 14 Sep") rather
// than a generic "nothing here": the trigger soft-deletes via
// dropped_at specifically so this history survives.
export async function fetchLastDropped(
  playerId: string,
  source: Database['public']['Enums']['comparison_source'],
): Promise<LastDroppedRow | null> {
  const { data, error } = await supabase
    .from('player_comparisons')
    .select('dropped_at, pro_players (name)')
    .eq('player_id', playerId)
    .eq('source', source)
    .not('dropped_at', 'is', null)
    .order('dropped_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { name: (data.pro_players as unknown as { name: string }).name, droppedAt: data.dropped_at! }
}

// Goes through an Edge Function, not a direct table query: the
// API-Football key can't live in the browser, and this is also what
// caches real search hits into pro_players (keyed by external_id) so
// the same name doesn't cost another request next time.
export async function searchProPlayers(query: string): Promise<ProPlayerRow[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const { data, error } = await supabase.functions.invoke<{ results: ProPlayerRow[] }>('pro-players-search', {
    body: { query: trimmed },
  })
  if (error) throw error
  return data?.results ?? []
}

export interface CooldownRow {
  proPlayerId: string
  availableAt: string
}

// Design open question 13, answered: yes, a dropped name can be
// reclaimed, but not for a month, matching the DB's own
// `interval '1 month'` check on insert. Fetches recent drops for this
// subject+source so the picker can show the cooldown before the user
// tries and gets rejected by RLS.
export async function fetchCooldowns(
  playerId: string,
  source: Database['public']['Enums']['comparison_source'],
): Promise<CooldownRow[]> {
  const cutoff = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('player_comparisons')
    .select('pro_player_id, dropped_at')
    .eq('player_id', playerId)
    .eq('source', source)
    .not('dropped_at', 'is', null)
    .gt('dropped_at', cutoff)
  if (error) throw error
  return (data ?? []).map((d) => {
    const availableAt = new Date(d.dropped_at!)
    availableAt.setMonth(availableAt.getMonth() + 1)
    return { proPlayerId: d.pro_player_id, availableAt: availableAt.toISOString() }
  })
}

// Premier League stats only, and only for the 2022-2024 seasons the
// account's Free API-Football plan actually has access to. Called once,
// right before a comparison is created, not on every search keystroke.
export async function refreshProPlayerStats(proPlayerId: string) {
  const { error } = await supabase.functions.invoke('pro-players-refresh-stats', {
    body: { proPlayerId },
  })
  if (error) throw error
}

export async function createComparison(params: {
  playerId: string
  proPlayerId: string
  source: Database['public']['Enums']['comparison_source']
  createdBy: string
}) {
  const { error } = await supabase.from('player_comparisons').insert({
    player_id: params.playerId,
    pro_player_id: params.proPlayerId,
    source: params.source,
    created_by: params.createdBy,
  })
  if (error) throw error
}

export async function removeComparison(comparisonId: string) {
  const { error } = await supabase.from('player_comparisons').delete().eq('id', comparisonId)
  if (error) throw error
}

export async function castVote(params: {
  comparisonId: string
  voterId: string
  direction: 'up' | 'down' | null
}) {
  if (params.direction === null) {
    const { error } = await supabase
      .from('comparison_votes')
      .delete()
      .eq('comparison_id', params.comparisonId)
      .eq('voter_id', params.voterId)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('comparison_votes').upsert(
    {
      comparison_id: params.comparisonId,
      voter_id: params.voterId,
      direction: params.direction,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'comparison_id,voter_id' },
  )
  if (error) throw error
}
