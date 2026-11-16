import { publishTeamDraw } from '@/features/matchday/draw/api'
import { supabase } from '@/lib/supabase'
import { EMPTY_DRAFT, teamsFromDraft, type DraftState } from './turn'

export async function fetchDraft(matchdayId: string): Promise<DraftState> {
  const { data: session, error } = await supabase
    .from('draft_sessions')
    .select('id, matchday_id, team_count, pool, status')
    .eq('matchday_id', matchdayId)
    .in('status', ['live', 'complete'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!session) return EMPTY_DRAFT

  const [captains, picks] = await Promise.all([
    supabase.from('draft_captains').select('slot, player_id').eq('session_id', session.id).order('slot'),
    supabase.from('draft_picks').select('pick_no, slot, player_id, picked_by').eq('session_id', session.id).order('pick_no'),
  ])
  if (captains.error) throw captains.error
  if (picks.error) throw picks.error
  return { session: { ...session, status: session.status as 'live' | 'complete' }, captains: captains.data ?? [], picks: picks.data ?? [] }
}

export async function startDraft(matchdayId: string, teamCount: number, captains: string[], pool: string[]) {
  const { data, error } = await supabase.rpc('start_draft', { p_matchday: matchdayId, p_team_count: teamCount, p_captains: captains, p_pool: pool })
  if (error) throw error
  return data
}

export async function pickPlayer(sessionId: string, playerId: string) {
  const { error } = await supabase.rpc('draft_pick', { p_session: sessionId, p_player: playerId })
  if (error) throw error
}

export async function undoPick(sessionId: string) {
  const { error } = await supabase.rpc('draft_undo', { p_session: sessionId })
  if (error) throw error
}

export async function cancelDraft(sessionId: string) {
  const { error } = await supabase.rpc('draft_cancel', { p_session: sessionId })
  if (error) throw error
}

/** Writes the sides exactly as picked, which posts the teams and tells everyone, then closes the selection. */
export async function publishDraft(matchdayId: string, state: DraftState) {
  await publishTeamDraw(matchdayId, teamsFromDraft(state))
  const { error } = await supabase.rpc('draft_mark_published', { p_session: state.session!.id })
  if (error) throw error
}
