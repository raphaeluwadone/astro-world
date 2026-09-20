import { drawTeams } from '@/features/matchday/draw/drawTeams'
import type { PlayerSummary } from '@/features/matchday/api'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type CupStatus = Database['public']['Enums']['cup_status']
export type CupQuarter = Database['public']['Tables']['cup_quarters']['Row']

export interface CupEntrantRow {
  id: string
  player_id: string
  created_at: string
  players: PlayerSummary
}

export interface CupSquad {
  id: string
  name: string
  colour: string
  members: PlayerSummary[]
}

export interface CupMatch {
  id: string
  squad_a_id: string
  squad_b_id: string
  squad_a_name: string
  squad_b_name: string
  score_a: number | null
  score_b: number | null
  played_at: string | null
}

const PLAYER_SUMMARY_COLS = 'id, nickname, full_name, favourite_number'

const NOT_PAST: CupStatus[] = ['open', 'drawn', 'live']

/**
 * The one cup to show: whichever quarter hasn't been played yet (open,
 * drawn or live, soonest first), or failing that the most recently
 * played one, so the page has something honest to show even between
 * quarters. Cancelled quarters are never surfaced.
 */
export async function fetchCurrentCup(): Promise<CupQuarter | null> {
  const { data: active, error: activeError } = await supabase
    .from('cup_quarters')
    .select('*')
    .in('status', NOT_PAST)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (activeError) throw activeError
  if (active) return active

  const { data: past, error: pastError } = await supabase
    .from('cup_quarters')
    .select('*')
    .eq('status', 'played')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (pastError) throw pastError
  return past
}

export async function fetchPastCups(): Promise<CupQuarter[]> {
  const { data, error } = await supabase
    .from('cup_quarters')
    .select('*')
    .eq('status', 'played')
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchEntrants(cupQuarterId: string): Promise<CupEntrantRow[]> {
  const { data, error } = await supabase
    .from('cup_entrants')
    .select(`id, player_id, created_at, players (${PLAYER_SUMMARY_COLS})`)
    .eq('cup_quarter_id', cupQuarterId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as CupEntrantRow[]
}

export async function fetchSquads(cupQuarterId: string): Promise<CupSquad[]> {
  const { data, error } = await supabase
    .from('cup_squads')
    .select(`id, name, colour, cup_squad_players (players (${PLAYER_SUMMARY_COLS}))`)
    .eq('cup_quarter_id', cupQuarterId)
  if (error) throw error
  return ((data ?? []) as unknown as Array<{
    id: string
    name: string
    colour: string
    cup_squad_players: Array<{ players: PlayerSummary }>
  }>).map((s) => ({
    id: s.id,
    name: s.name,
    colour: s.colour,
    members: s.cup_squad_players.map((m) => m.players),
  }))
}

export async function fetchMatches(cupQuarterId: string): Promise<CupMatch[]> {
  const { data, error } = await supabase
    .from('cup_matches')
    .select('id, squad_a_id, squad_b_id, score_a, score_b, played_at, squad_a:cup_squads!cup_matches_squad_a_id_fkey (name), squad_b:cup_squads!cup_matches_squad_b_id_fkey (name)')
    .eq('cup_quarter_id', cupQuarterId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as Array<{
    id: string
    squad_a_id: string
    squad_b_id: string
    score_a: number | null
    score_b: number | null
    played_at: string | null
    squad_a: { name: string }
    squad_b: { name: string }
  }>).map((m) => ({
    id: m.id,
    squad_a_id: m.squad_a_id,
    squad_b_id: m.squad_b_id,
    squad_a_name: m.squad_a.name,
    squad_b_name: m.squad_b.name,
    score_a: m.score_a,
    score_b: m.score_b,
    played_at: m.played_at,
  }))
}

export async function joinCup(cupQuarterId: string, playerId: string) {
  const { error } = await supabase.from('cup_entrants').insert({ cup_quarter_id: cupQuarterId, player_id: playerId })
  if (error) throw error
}

export async function leaveCup(entrantId: string) {
  const { error } = await supabase.from('cup_entrants').delete().eq('id', entrantId)
  if (error) throw error
}

export interface NewCupQuarterFields {
  label: string
  venue: string | null
  scheduledAt: string
  entriesCloseAt: string
  withdrawalDeadline: string
}

export async function createCupQuarter(fields: NewCupQuarterFields): Promise<string> {
  const { data, error } = await supabase
    .from('cup_quarters')
    .insert({
      label: fields.label,
      venue: fields.venue,
      scheduled_at: fields.scheduledAt,
      entries_close_at: fields.entriesCloseAt,
      withdrawal_deadline: fields.withdrawalDeadline,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateCupStatus(cupQuarterId: string, status: CupStatus) {
  const { error } = await supabase.from('cup_quarters').update({ status }).eq('id', cupQuarterId)
  if (error) throw error
}

const SQUAD_PALETTE = ['#f2a93b', '#38bdf8', '#4ade80', '#a63fff', '#e0483f', '#eef0f9']

export interface RunCupDrawResult {
  squadCount: number
}

/**
 * Random draw, reusing the exact same shuffle/partition algorithm built
 * for Sunday's teams (src/features/matchday/draw/drawTeams.ts), scoped
 * to however many entrants there are rather than a fixed 3 squads (the
 * design's live-draft mechanic is undesigned, see project memory).
 * Squads get a placeholder "Squad N" name, admin renames after.
 */
export async function runCupDraw(cupQuarterId: string): Promise<RunCupDrawResult> {
  const entrants = await fetchEntrants(cupQuarterId)
  const playerIds = entrants.map((e) => e.player_id)

  if (playerIds.length === 0 || playerIds.length % 6 !== 0) {
    throw new Error(`Expected a multiple of 6 entrants, found ${playerIds.length}.`)
  }

  const { teams } = drawTeams(playerIds, new Set())

  const { data: insertedSquads, error: squadsError } = await supabase
    .from('cup_squads')
    .insert(
      teams.map((_, i) => ({
        cup_quarter_id: cupQuarterId,
        name: `Squad ${i + 1}`,
        colour: SQUAD_PALETTE[i % SQUAD_PALETTE.length],
      })),
    )
    .select('id')
  if (squadsError) throw squadsError

  const memberRows = insertedSquads.flatMap((squad, i) => teams[i].map((playerId) => ({ cup_squad_id: squad.id, player_id: playerId })))
  const { error: membersError } = await supabase.from('cup_squad_players').insert(memberRows)
  if (membersError) throw membersError

  const { error: statusError } = await supabase.from('cup_quarters').update({ status: 'drawn' }).eq('id', cupQuarterId)
  if (statusError) throw statusError

  return { squadCount: teams.length }
}

export async function renameSquad(squadId: string, name: string) {
  const { error } = await supabase.from('cup_squads').update({ name }).eq('id', squadId)
  if (error) throw error
}

export async function addPlayerToSquad(squadId: string, playerId: string) {
  const { error } = await supabase.from('cup_squad_players').insert({ cup_squad_id: squadId, player_id: playerId })
  if (error) throw error
}

export async function removePlayerFromSquad(squadId: string, playerId: string) {
  const { error } = await supabase.from('cup_squad_players').delete().eq('cup_squad_id', squadId).eq('player_id', playerId)
  if (error) throw error
}

export interface NewCupMatchFields {
  cupQuarterId: string
  squadAId: string
  squadBId: string
}

export async function createCupMatch(fields: NewCupMatchFields): Promise<string> {
  const { data, error } = await supabase
    .from('cup_matches')
    .insert({ cup_quarter_id: fields.cupQuarterId, squad_a_id: fields.squadAId, squad_b_id: fields.squadBId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function recordCupMatchScore(matchId: string, scoreA: number, scoreB: number) {
  const { error } = await supabase
    .from('cup_matches')
    .update({ score_a: scoreA, score_b: scoreB, played_at: new Date().toISOString() })
    .eq('id', matchId)
  if (error) throw error
}

export async function deleteCupMatch(matchId: string) {
  const { error } = await supabase.from('cup_matches').delete().eq('id', matchId)
  if (error) throw error
}

export interface CupWinner {
  quarter: CupQuarter
  winnerName: string | null
  winnerColour: string | null
}

/** Real winner per past quarter, computed from its own matches, never a
 * fabricated honours entry. Null when a played quarter never had any
 * scored fixtures (nothing to crown). */
export async function fetchCupWinner(quarter: CupQuarter): Promise<CupWinner> {
  const [squads, matches] = await Promise.all([fetchSquads(quarter.id), fetchMatches(quarter.id)])
  const { computeCupStandings } = await import('./standings')
  const [top] = computeCupStandings(squads, matches).filter((s) => s.played > 0)
  return { quarter, winnerName: top?.name ?? null, winnerColour: top?.colour ?? null }
}
