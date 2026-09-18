import type { PlayerSummary } from '@/features/matchday/api'
import { supabase } from '@/lib/supabase'

export interface MatchDetail {
  id: string
  matchday_id: string
  score_a: number
  score_b: number
  played_at: string
  team_a: { id: string; greek_name: string; colour: string }
  team_b: { id: string; greek_name: string; colour: string }
  matchdays: { played_at: string; venue: string | null }
}

export interface LineupRow {
  player_id: string
  team_id: string
  players: PlayerSummary & { positions: string[] }
  rating: number | null
}

export interface GoalRow {
  id: string
  team_id: string
  minute: number
  scorer: PlayerSummary
  assist: PlayerSummary | null
}

export interface RatingsIntegrity {
  voter_count: number
  match_avg: number | null
  lowest_avg: number | null
}

const PLAYER_SUMMARY_COLS = 'id, nickname, full_name'

export async function fetchMatch(matchId: string): Promise<MatchDetail | null> {
  // maybeSingle, not single: an unknown/mistyped matchId is a normal
  // "not found" outcome, not a server error (single() 406s on zero rows).
  const { data, error } = await supabase
    .from('matches')
    .select(
      `id, matchday_id, score_a, score_b, played_at,
       team_a:teams!matches_team_a_id_fkey (id, greek_name, colour),
       team_b:teams!matches_team_b_id_fkey (id, greek_name, colour),
       matchdays (played_at, venue)`,
    )
    .eq('id', matchId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as MatchDetail | null
}

export async function fetchLineups(matchId: string): Promise<LineupRow[]> {
  const [{ data: matchPlayers, error: mpError }, { data: ratings, error: rError }] = await Promise.all([
    supabase
      .from('match_players')
      .select(`player_id, team_id, players (${PLAYER_SUMMARY_COLS}, positions)`)
      .eq('match_id', matchId),
    supabase.rpc('match_ratings_summary'),
  ])
  if (mpError) throw mpError
  if (rError) throw rError

  const ratingBySubject = new Map(
    (ratings ?? [])
      .filter((r) => r.match_id === matchId)
      .map((r) => [r.subject_id, r.avg_rating]),
  )

  return ((matchPlayers ?? []) as unknown as Array<{
    player_id: string
    team_id: string
    players: PlayerSummary & { positions: string[] }
  }>).map((row) => ({
    ...row,
    rating: ratingBySubject.get(row.player_id) ?? null,
  }))
}

export async function fetchGoals(matchId: string): Promise<GoalRow[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(
      `id, team_id, minute,
       scorer:players!goals_scorer_id_fkey (${PLAYER_SUMMARY_COLS}),
       assist:players!goals_assist_id_fkey (${PLAYER_SUMMARY_COLS})`,
    )
    .eq('match_id', matchId)
    .order('minute', { ascending: true })
  if (error) throw error
  return data as unknown as GoalRow[]
}

export async function fetchRatingsIntegrity(matchId: string): Promise<RatingsIntegrity> {
  const { data, error } = await supabase.rpc('match_ratings_integrity', { p_match_id: matchId })
  if (error) throw error
  return (data?.[0] as RatingsIntegrity) ?? { voter_count: 0, match_avg: null, lowest_avg: null }
}

export interface MotmWinner {
  player: PlayerSummary
  voteCount: number
  totalVotes: number
}

export async function fetchMotmWinner(matchdayId: string): Promise<MotmWinner | null> {
  const { data: tallies, error } = await supabase.rpc('matchday_motm_summary')
  if (error) throw error
  const forThisMatchday = (tallies ?? []).filter((t) => t.matchday_id === matchdayId)
  if (forThisMatchday.length === 0) return null
  const winner = forThisMatchday.reduce((best, t) => (t.vote_count > best.vote_count ? t : best))
  const totalVotes = forThisMatchday.reduce((sum, t) => sum + t.vote_count, 0)
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select(PLAYER_SUMMARY_COLS)
    .eq('id', winner.nominee_id)
    .single()
  if (playerError) throw playerError
  return { player, voteCount: winner.vote_count, totalVotes }
}
