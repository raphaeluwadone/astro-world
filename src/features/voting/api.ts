import { supabase } from '@/lib/supabase'
import type { PlayerSummary } from '@/features/matchday/api'

export interface RatingMatchday {
  matchdayId: string
  playedAt: string
  venue: string | null
  closesAt: string
  isOpen: boolean
  partOf: boolean
  openToEveryone: boolean
  canRate: boolean
  /** Game-by-game ratings, only on the matchday itself. */
  perGameOpen: boolean
}

export interface RosterPlayer extends PlayerSummary {
  team_id: string
  team_name: string
  team_colour: string
  positions: string[]
}

export async function fetchRatingMatchday(): Promise<RatingMatchday | null> {
  const { data, error } = await supabase.rpc('rating_matchday')
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  return {
    matchdayId: row.matchday_id,
    playedAt: row.played_at,
    venue: row.venue,
    closesAt: row.closes_at,
    isOpen: row.is_open,
    partOf: row.part_of,
    openToEveryone: row.open_to_everyone,
    canRate: row.can_rate,
    perGameOpen: row.per_game_open,
  }
}

export async function fetchRoster(matchdayId: string): Promise<RosterPlayer[]> {
  const { data: rows, error } = await supabase.rpc('matchday_rating_roster', { p_matchday: matchdayId })
  if (error) throw error
  if (!rows?.length) return []
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, nickname, full_name, positions, favourite_number')
    .in('id', rows.map((r) => r.player_id))
  if (playersError) throw playersError
  const byId = new Map((players ?? []).map((p) => [p.id, p]))
  return rows
    .filter((r) => byId.has(r.player_id))
    .map((r) => ({ ...byId.get(r.player_id)!, team_id: r.team_id, team_name: r.greek_name, team_colour: r.colour }))
    .sort((a, b) => a.nickname.localeCompare(b.nickname))
}

export async function fetchMyScores(matchdayId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('ratings').select('subject_id, score').eq('matchday_id', matchdayId)
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.subject_id, Number(r.score)]))
}

/** Null score clears it; no gameId means the whole-day rating. */
export async function ratePlayer(matchdayId: string, subjectId: string, score: number | null, gameId?: string) {
  const { error } = await supabase.rpc('rate_player', { p_matchday: matchdayId, p_subject: subjectId, p_score: score, p_game: gameId })
  if (error) throw error
}

export interface RatingGame {
  id: string
  no: number
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
  players: Map<string, string>
}

/** The day's ended games, each with its players mapped to the side they played for. */
export async function fetchRatingGames(matchdayId: string): Promise<RatingGame[]> {
  const [games, players] = await Promise.all([
    supabase.rpc('rating_games', { p_matchday: matchdayId }),
    supabase.rpc('rating_game_players', { p_matchday: matchdayId }),
  ])
  if (games.error) throw games.error
  if (players.error) throw players.error
  return (games.data ?? []).map((g) => ({
    id: g.game_id,
    no: g.game_no,
    teamAId: g.team_a_id,
    teamBId: g.team_b_id,
    scoreA: g.score_a,
    scoreB: g.score_b,
    players: new Map((players.data ?? []).filter((p) => p.game_id === g.game_id).map((p) => [p.player_id, p.team_id])),
  }))
}

export const inputKey = (subjectId: string, gameId?: string) => `${subjectId}:${gameId ?? 'day'}`

/** Every score I've given this matchday, per game and whole day, keyed by inputKey. */
export async function fetchMyInputs(matchdayId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('rating_inputs').select('subject_id, game_id, score').eq('matchday_id', matchdayId)
  if (error) throw error
  return new Map((data ?? []).map((r) => [inputKey(r.subject_id, r.game_id ?? undefined), Number(r.score)]))
}

export async function fetchRatingsOpenToEveryone(): Promise<boolean> {
  const { data, error } = await supabase.from('rating_settings').select('open_to_everyone').single()
  if (error) throw error
  return data.open_to_everyone
}

export async function setRatingsOpenToEveryone(value: boolean) {
  const { error } = await supabase
    .from('rating_settings')
    .update({ open_to_everyone: value, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) throw error
}

/** Games I've pressed Done on; their scores are locked. */
export async function fetchDoneGames(matchdayId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('rating_games_done').select('game_id').eq('matchday_id', matchdayId)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.game_id))
}

export async function finishGame(matchdayId: string, gameId: string) {
  const { error } = await supabase.rpc('finish_game_ratings', { p_matchday: matchdayId, p_game: gameId })
  if (error) throw error
}
