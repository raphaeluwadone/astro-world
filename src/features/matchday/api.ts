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

export interface WeeklyClaimRow {
  player_id: string
  claimed_at: string
  players: PlayerSummary
}

export interface StandbyEntryRow {
  player_id: string
  created_at: string
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

// 'complete' is retired going forward (see the played/cancelled migration)
// but still excluded here in case an older row never got migrated.
const DONE_STATUSES = ['played', 'complete', 'cancelled'] as const

export async function fetchNextMatchday() {
  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .not('status', 'in', `(${DONE_STATUSES.join(',')})`)
    .order('played_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export interface NewMatchdayFields {
  playedAt: string
  venue: string | null
  capacity: 30 | 36
}

export async function createMatchday(fields: NewMatchdayFields): Promise<string> {
  const { data, error } = await supabase
    .from('matchdays')
    .insert({ played_at: fields.playedAt, venue: fields.venue, capacity: fields.capacity })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function fetchLastCompleteMatchday() {
  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .in('status', ['played', 'complete'])
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

export async function fetchWeeklyClaims(matchdayId: string): Promise<WeeklyClaimRow[]> {
  const { data, error } = await supabase
    .from('weekly_claims')
    .select(`player_id, claimed_at, players (${PLAYER_SUMMARY_COLS})`)
    .eq('matchday_id', matchdayId)
    .order('claimed_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as WeeklyClaimRow[]
}

export async function claimWeeklySpot(matchdayId: string, playerId: string) {
  const { error } = await supabase.from('weekly_claims').insert({ matchday_id: matchdayId, player_id: playerId })
  if (error) throw error
}

export async function withdrawWeeklyClaim(matchdayId: string, playerId: string) {
  const { error } = await supabase
    .from('weekly_claims')
    .delete()
    .eq('matchday_id', matchdayId)
    .eq('player_id', playerId)
  if (error) throw error
}

export async function fetchStandbyEntries(matchdayId: string): Promise<StandbyEntryRow[]> {
  const { data, error } = await supabase
    .from('matchday_standby_entries')
    .select(`player_id, created_at, players (${PLAYER_SUMMARY_COLS})`)
    .eq('matchday_id', matchdayId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as StandbyEntryRow[]
}

export async function joinStandby(matchdayId: string, playerId: string) {
  const { error } = await supabase.from('matchday_standby_entries').insert({ matchday_id: matchdayId, player_id: playerId })
  if (error) throw error
}

export async function leaveStandby(matchdayId: string, playerId: string) {
  const { error } = await supabase
    .from('matchday_standby_entries')
    .delete()
    .eq('matchday_id', matchdayId)
    .eq('player_id', playerId)
  if (error) throw error
}

export async function fetchWeeklySpotsRemaining(matchdayId: string): Promise<number> {
  const { data, error } = await supabase.rpc('weekly_spots_remaining', { p_matchday_id: matchdayId })
  if (error) throw error
  return data
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

/** First-of-month date string (YYYY-MM-DD) for the month a matchday falls in. */
export function monthOf(playedAtIso: string): string {
  const d = new Date(playedAtIso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export interface MonthlyMemberRow {
  player_id: string
  claimed_at: string
  players: PlayerSummary
}

export async function fetchMonthlyMembers(month: string): Promise<MonthlyMemberRow[]> {
  const { data, error } = await supabase
    .from('monthly_memberships')
    .select(`player_id, claimed_at, players (${PLAYER_SUMMARY_COLS})`)
    .eq('month', month)
    .order('claimed_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as MonthlyMemberRow[]
}

export async function claimMonthlySlot(playerId: string, month: string) {
  const { error } = await supabase.from('monthly_memberships').insert({ player_id: playerId, month })
  if (error) throw error
}

export async function updateMatchdayCapacity(matchdayId: string, capacity: 30 | 36) {
  const { error } = await supabase.from('matchdays').update({ capacity }).eq('id', matchdayId)
  if (error) throw error
}

