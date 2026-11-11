import { supabase } from '@/lib/supabase'

export interface PitchGoal {
  id: string
  game_id: string
  team_id: string
  scorer_id: string | null
  assist_id: string | null
  minute: number | null
  created_at: string
}

export interface PitchGame {
  id: string
  team_a_id: string
  team_b_id: string
  length_min: number
  goal_target: number
  elapsed_ms: number
  running_since: string | null
  ended_at: string | null
  report: string | null
  created_at: string
  goals: PitchGoal[]
}

export interface PitchSession {
  team_order: string[]
  goal_target: number
  length_min: number
}

export interface PitchState {
  checkedIn: Set<string>
  games: PitchGame[]
  session: PitchSession | null
}

export async function fetchPitch(matchdayId: string): Promise<PitchState> {
  const [checkins, games, session] = await Promise.all([
    supabase.from('pitch_checkins').select('player_id').eq('matchday_id', matchdayId),
    supabase
      .from('pitch_games')
      .select('id, team_a_id, team_b_id, length_min, goal_target, elapsed_ms, running_since, ended_at, report, created_at, goals:pitch_goals(id, game_id, team_id, scorer_id, assist_id, minute, created_at)')
      .eq('matchday_id', matchdayId)
      .order('created_at'),
    supabase.from('pitch_sessions').select('team_order, goal_target, length_min').eq('matchday_id', matchdayId).maybeSingle(),
  ])
  if (checkins.error) throw checkins.error
  if (games.error) throw games.error
  if (session.error) throw session.error
  return {
    session: session.data,
    checkedIn: new Set((checkins.data ?? []).map((c) => c.player_id)),
    games: (games.data ?? []).map((g) => ({ ...g, goals: [...g.goals].sort((a, b) => a.created_at.localeCompare(b.created_at)) })),
  }
}

/** Milliseconds on a game's clock right now. */
export function clockMs(g: Pick<PitchGame, 'elapsed_ms' | 'running_since'>, now = Date.now()) {
  return g.elapsed_ms + (g.running_since ? Math.max(0, now - new Date(g.running_since).getTime()) : 0)
}

/** Football-style minute: the first minute is 1′. */
export const minuteOf = (ms: number) => Math.floor(ms / 60_000) + 1

export async function setCheckins(matchdayId: string, playerIds: string[], on: boolean, by: string) {
  if (playerIds.length === 0) return
  const q = on
    ? supabase.from('pitch_checkins').upsert(
        playerIds.map((player_id) => ({ matchday_id: matchdayId, player_id, checked_in_by: by })),
        { onConflict: 'matchday_id,player_id', ignoreDuplicates: true },
      )
    : supabase.from('pitch_checkins').delete().eq('matchday_id', matchdayId).in('player_id', playerIds)
  const { error } = await q
  if (error) throw error
}

export async function saveSession(matchdayId: string, session: PitchSession) {
  const { error } = await supabase.from('pitch_sessions').upsert({ matchday_id: matchdayId, ...session, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function startGame(matchdayId: string, teamAId: string, teamBId: string, lengthMin: number, goalTarget: number) {
  const { data, error } = await supabase
    .from('pitch_games')
    .insert({ matchday_id: matchdayId, team_a_id: teamAId, team_b_id: teamBId, length_min: lengthMin, goal_target: goalTarget, running_since: new Date().toISOString() })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function setRunning(game: PitchGame, running: boolean) {
  const now = Date.now()
  const patch = running
    ? { running_since: new Date(now).toISOString(), ended_at: null }
    : { running_since: null, elapsed_ms: Math.round(clockMs(game, now)) }
  const { error } = await supabase.from('pitch_games').update(patch).eq('id', game.id)
  if (error) throw error
}

export async function endGame(game: PitchGame, report: string) {
  const { error } = await supabase
    .from('pitch_games')
    .update({ running_since: null, elapsed_ms: Math.round(clockMs(game)), ended_at: new Date().toISOString(), report: report.trim() || null })
    .eq('id', game.id)
  if (error) throw error
}

/** Saves edits to a finished game; the stamp makes the match report rewrite itself. */
export async function saveEdit(gameId: string, report: string) {
  const { error } = await supabase.from('pitch_games').update({ report: report.trim() || null, edited_at: new Date().toISOString() }).eq('id', gameId)
  if (error) throw error
}

export async function deleteGame(gameId: string) {
  const { error } = await supabase.from('pitch_games').delete().eq('id', gameId)
  if (error) throw error
}

/** Live goals take the clock's minute; goals added to a finished game have none until typed. */
export async function addGoal(game: PitchGame, teamId: string, scorerId: string | null, by: string) {
  const { data, error } = await supabase
    .from('pitch_goals')
    .insert({ game_id: game.id, team_id: teamId, scorer_id: scorerId, minute: game.ended_at ? null : minuteOf(clockMs(game)), created_by: by })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateGoal(goalId: string, patch: { scorer_id?: string | null; assist_id?: string | null; minute?: number | null }) {
  const { error } = await supabase.from('pitch_goals').update(patch).eq('id', goalId)
  if (error) throw error
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase.from('pitch_goals').delete().eq('id', goalId)
  if (error) throw error
}

export async function fetchSwapCandidates() {
  const { data, error } = await supabase.from('players').select('id, nickname, full_name, favourite_number').is('left_at', null).order('nickname')
  if (error) throw error
  return data ?? []
}

/** A walk-in with no account: a player record with just a nickname, claimable later. */
export async function addWalkIn(nickname: string) {
  const name = nickname.trim()
  const { data, error } = await supabase.from('players').insert({ nickname: name, full_name: name }).select('id').single()
  if (error) throw error
  return data.id
}

/** Puts `inId` in `outId`'s place on the team and checks them in. */
export async function swapPlayer(matchdayId: string, teamId: string, outId: string, inId: string, by: string) {
  const { error } = await supabase.from('team_members').update({ player_id: inId }).eq('team_id', teamId).eq('player_id', outId)
  if (error) throw error
  await setCheckins(matchdayId, [outId], false, by)
  await setCheckins(matchdayId, [inId], true, by)
}
