import { supabase } from '@/lib/supabase'
import type { PlayerSummary } from '@/features/matchday/api'

export interface TeamRef {
  id: string
  greek_name: string
  colour: string
}

export interface MatchToRate {
  matchId: string
  playedAt: string
  venue: string | null
  myTeam: TeamRef
  oppTeam: TeamRef
}

export interface RosterPlayer extends PlayerSummary {
  team_id: string
  positions: string[]
}

/** The most recent match this player actually played in: the design's own
 * "your side / against you" framing is per-match, matching the real RLS
 * eligibility check (played_in_match), so there's no "pick a match" step.
 * Sorted client-side (a handful of rows per player at most) since PostgREST
 * can't order the outer query by an embedded resource's column. */
export async function fetchMyMatchToRate(playerId: string): Promise<MatchToRate | null> {
  const { data, error } = await supabase
    .from('match_players')
    .select(
      `team_id,
       matches (
         id, played_at,
         matchdays (venue),
         team_a:teams!matches_team_a_id_fkey (id, greek_name, colour),
         team_b:teams!matches_team_b_id_fkey (id, greek_name, colour)
       )`,
    )
    .eq('player_id', playerId)
  if (error) throw error
  if (!data || data.length === 0) return null

  const rows = data as unknown as Array<{
    team_id: string
    matches: {
      id: string
      played_at: string
      matchdays: { venue: string | null } | null
      team_a: TeamRef
      team_b: TeamRef
    }
  }>
  const latest = rows.sort(
    (a, b) => new Date(b.matches.played_at).getTime() - new Date(a.matches.played_at).getTime(),
  )[0]

  const match = latest.matches
  const myTeam = latest.team_id === match.team_a.id ? match.team_a : match.team_b
  const oppTeam = latest.team_id === match.team_a.id ? match.team_b : match.team_a

  return {
    matchId: match.id,
    playedAt: match.played_at,
    venue: match.matchdays?.venue ?? null,
    myTeam,
    oppTeam,
  }
}

export async function fetchRatingsOpen(matchId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('ratings_open_for', { p_match_id: matchId })
  if (error) throw error
  return !!data
}

export async function fetchRoster(matchId: string): Promise<RosterPlayer[]> {
  const { data, error } = await supabase
    .from('match_players')
    .select('team_id, players (id, nickname, full_name, positions, favourite_number)')
    .eq('match_id', matchId)
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...(row.players as unknown as RosterPlayer),
    team_id: row.team_id,
  }))
}

export async function fetchMyScores(matchId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('ratings')
    .select('subject_id, score')
    .eq('match_id', matchId)
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.subject_id, Number(r.score)]))
}

export async function upsertRating(
  matchId: string,
  raterId: string,
  subjectId: string,
  score: number,
) {
  const { error } = await supabase
    .from('ratings')
    .upsert(
      { match_id: matchId, rater_id: raterId, subject_id: subjectId, score },
      { onConflict: 'match_id,rater_id,subject_id' },
    )
  if (error) throw error
}
