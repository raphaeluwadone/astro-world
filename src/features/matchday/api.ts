import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type AvailabilityStatus = Database['public']['Enums']['availability_status']

export interface PlayerSummary {
  id: string
  nickname: string
  full_name: string
  favourite_number: number | null
}

export interface AvailabilityRow {
  player_id: string
  status: AvailabilityStatus
  responded_at: string
  players: PlayerSummary
}

export interface BallotEntryRow {
  player_id: string
  status: Database['public']['Enums']['ballot_entry_status']
  standby_position: number | null
  players: PlayerSummary
}

export interface TeamWithMembers {
  id: string
  greek_name: string
  colour: string
  members: PlayerSummary[]
}

export interface MatchResultRow {
  id: string
  score_a: number
  score_b: number
  team_a: { greek_name: string; colour: string }
  team_b: { greek_name: string; colour: string }
}

const PLAYER_SUMMARY_COLS = 'id, nickname, full_name, favourite_number'

export async function fetchNextMatchday() {
  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .neq('status', 'complete')
    .order('played_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchLastCompleteMatchday() {
  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .eq('status', 'complete')
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchActivePlayers(): Promise<PlayerSummary[]> {
  const { data, error } = await supabase
    .from('players')
    .select(PLAYER_SUMMARY_COLS)
    .not('user_id', 'is', null)
    .order('nickname', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchAvailability(matchdayId: string): Promise<AvailabilityRow[]> {
  const { data, error } = await supabase
    .from('availability')
    .select(`player_id, status, responded_at, players (${PLAYER_SUMMARY_COLS})`)
    .eq('matchday_id', matchdayId)
  if (error) throw error
  return (data ?? []) as unknown as AvailabilityRow[]
}

export async function fetchBallotEntries(matchdayId: string): Promise<BallotEntryRow[]> {
  const { data, error } = await supabase
    .from('matchday_ballot_entries')
    .select(`player_id, status, standby_position, players (${PLAYER_SUMMARY_COLS})`)
    .eq('matchday_id', matchdayId)
    .order('standby_position', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as unknown as BallotEntryRow[]
}

export async function fetchDrawnTeams(matchdayId: string): Promise<TeamWithMembers[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`id, greek_name, colour, team_members (players (${PLAYER_SUMMARY_COLS}))`)
    .eq('matchday_id', matchdayId)
    .order('greek_name', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as Array<{
    id: string
    greek_name: string
    colour: string
    team_members: Array<{ players: PlayerSummary }>
  }>).map((team) => ({
    id: team.id,
    greek_name: team.greek_name,
    colour: team.colour,
    members: team.team_members.map((tm) => tm.players),
  }))
}

export async function fetchMatchResults(matchdayId: string): Promise<MatchResultRow[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, score_a, score_b, team_a:teams!matches_team_a_id_fkey (greek_name, colour), team_b:teams!matches_team_b_id_fkey (greek_name, colour)',
    )
    .eq('matchday_id', matchdayId)
    .order('played_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as MatchResultRow[]
}

export async function setAvailability(
  matchdayId: string,
  playerId: string,
  status: AvailabilityStatus,
) {
  const { error } = await supabase
    .from('availability')
    .upsert(
      { matchday_id: matchdayId, player_id: playerId, status, responded_at: new Date().toISOString() },
      { onConflict: 'matchday_id,player_id' },
    )
  if (error) throw error
}
