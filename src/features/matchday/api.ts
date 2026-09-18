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

export interface RunBallotResult {
  balloted: number
  standby: number
  monthlyIn: number
}

/**
 * Selects who's actually playing: the first-come-first-served weekly
 * queue (availability.responded_at), plus this month's ten monthly-slot
 * holders auto-included unless they've explicitly marked themselves out
 * for this specific Sunday. Strictly FCFS, never random: randomization
 * only happens later, splitting the selected pool into teams (runTeamDraw).
 */
export async function runBallotSelection(matchdayId: string): Promise<RunBallotResult> {
  const { data: matchday, error: matchdayError } = await supabase
    .from('matchdays')
    .select('played_at, capacity')
    .eq('id', matchdayId)
    .single()
  if (matchdayError) throw matchdayError

  const month = monthOf(matchday.played_at)

  const [{ data: monthlyMembers, error: monthlyError }, { data: availability, error: availError }] =
    await Promise.all([
      supabase.from('monthly_memberships').select('player_id').eq('month', month),
      supabase.from('availability').select('player_id, status, responded_at').eq('matchday_id', matchdayId),
    ])
  if (monthlyError) throw monthlyError
  if (availError) throw availError

  const optedOut = new Set((availability ?? []).filter((a) => a.status === 'out').map((a) => a.player_id))
  const monthlyIn = (monthlyMembers ?? []).map((m) => m.player_id).filter((id) => !optedOut.has(id))
  const monthlyInSet = new Set(monthlyIn)

  const weeklyCandidates = (availability ?? [])
    .filter((a) => a.status === 'in' && !monthlyInSet.has(a.player_id))
    .sort((a, b) => new Date(a.responded_at).getTime() - new Date(b.responded_at).getTime())
    .map((a) => a.player_id)

  const remainingCapacity = Math.max(0, matchday.capacity - monthlyIn.length)
  const weeklyIn = weeklyCandidates.slice(0, remainingCapacity)
  const standby = weeklyCandidates.slice(remainingCapacity)

  const rows = [
    ...monthlyIn.map((player_id) => ({
      matchday_id: matchdayId,
      player_id,
      status: 'balloted' as const,
      standby_position: null,
    })),
    ...weeklyIn.map((player_id) => ({
      matchday_id: matchdayId,
      player_id,
      status: 'balloted' as const,
      standby_position: null,
    })),
    ...standby.map((player_id, i) => ({
      matchday_id: matchdayId,
      player_id,
      status: 'standby' as const,
      standby_position: i + 1,
    })),
  ]

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('matchday_ballot_entries').insert(rows)
    if (insertError) throw insertError
  }

  const { error: statusError } = await supabase
    .from('matchdays')
    .update({ status: 'balloted' })
    .eq('id', matchdayId)
  if (statusError) throw statusError

  return { balloted: monthlyIn.length + weeklyIn.length, standby: standby.length, monthlyIn: monthlyIn.length }
}
