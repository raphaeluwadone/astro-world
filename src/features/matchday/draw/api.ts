import { supabase } from '@/lib/supabase'
import { drawTeams, pairKey } from './drawTeams'

// Canonical TEAM_ID from the design source (Astro App.dc.html), indexed
// rather than duplicated as a literal anywhere else: colour drifted out
// of sync across screens once already when each one carried its own copy.
// Almost always 5 teams (30 players); Zeta only comes into play the
// occasional week an admin opens a 6th side (36 players, see matchdays.capacity).
const GREEK_TEAMS = [
  { name: 'Alpha', colour: '#38bdf8' },
  { name: 'Beta', colour: '#e0483f' },
  { name: 'Gamma', colour: '#a63fff' },
  { name: 'Delta', colour: '#4ade80' },
  { name: 'Epsilon', colour: '#f2a93b' },
  { name: 'Zeta', colour: '#cbd5f5' },
] as const

async function fetchBallotedPlayerIds(matchdayId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('matchday_ballot_entries')
    .select('player_id')
    .eq('matchday_id', matchdayId)
    .eq('status', 'balloted')
  if (error) throw error
  return (data ?? []).map((row) => row.player_id)
}

/** Pairings from the most recent PRIOR matchday that actually has drawn teams. */
async function fetchPreviousPairings(beforeMatchdayId: string): Promise<Set<string>> {
  const { data: current, error: currentError } = await supabase
    .from('matchdays')
    .select('played_at')
    .eq('id', beforeMatchdayId)
    .single()
  if (currentError) throw currentError

  const { data: previousMatchday, error: prevError } = await supabase
    .from('matchdays')
    .select('id')
    .lt('played_at', current.played_at)
    .order('played_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (prevError) throw prevError

  const pairings = new Set<string>()
  if (!previousMatchday) return pairings // no prior matchday: nothing to avoid repeating

  const { data: previousTeams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('matchday_id', previousMatchday.id)
  if (teamsError) throw teamsError
  if (!previousTeams || previousTeams.length === 0) return pairings // prior matchday was never drawn

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('team_id, player_id')
    .in(
      'team_id',
      previousTeams.map((t) => t.id),
    )
  if (membersError) throw membersError

  const byTeam = new Map<string, string[]>()
  for (const m of members ?? []) {
    const list = byTeam.get(m.team_id) ?? []
    list.push(m.player_id)
    byTeam.set(m.team_id, list)
  }
  for (const teamPlayers of byTeam.values()) {
    for (let i = 0; i < teamPlayers.length; i++) {
      for (let j = i + 1; j < teamPlayers.length; j++) {
        pairings.add(pairKey(teamPlayers[i], teamPlayers[j]))
      }
    }
  }
  return pairings
}

export interface RunDrawResult {
  repeatPairingsCount: number
}

/**
 * Runs the team draw for a matchday: reads the balloted players and the
 * previous week's pairings, computes the draw, and writes the result
 * (the teams + their members), then marks the matchday 'drawn'.
 *
 * Admin-only in practice: the `teams`/`team_members`/`matchdays` writes
 * this performs are all gated by admin-only RLS policies already, so a
 * non-admin calling this will simply get the writes rejected.
 */
export async function runTeamDraw(matchdayId: string): Promise<RunDrawResult> {
  const [playerIds, previousPairings] = await Promise.all([
    fetchBallotedPlayerIds(matchdayId),
    fetchPreviousPairings(matchdayId),
  ])

  if (playerIds.length === 0 || playerIds.length % 6 !== 0) {
    throw new Error(`Expected a multiple of 6 balloted players, found ${playerIds.length}`)
  }
  const teamCount = playerIds.length / 6
  if (teamCount > GREEK_TEAMS.length) {
    throw new Error(`No team name defined for a ${teamCount}-team draw`)
  }
  const teamsForThisDraw = GREEK_TEAMS.slice(0, teamCount)

  const { teams, repeatPairingsCount } = drawTeams(playerIds, previousPairings)

  const { data: insertedTeams, error: teamsError } = await supabase
    .from('teams')
    .insert(
      teamsForThisDraw.map((t) => ({ matchday_id: matchdayId, greek_name: t.name, colour: t.colour })),
    )
    .select('id, greek_name')
  if (teamsError) throw teamsError

  const teamIdByGreekName = new Map(insertedTeams.map((t) => [t.greek_name, t.id]))

  const memberRows = teamsForThisDraw.flatMap((greekTeam, index) => {
    const teamId = teamIdByGreekName.get(greekTeam.name)!
    return teams[index].map((playerId) => ({ team_id: teamId, player_id: playerId }))
  })

  const { error: membersError } = await supabase.from('team_members').insert(memberRows)
  if (membersError) throw membersError

  const { error: statusError } = await supabase
    .from('matchdays')
    .update({ status: 'drawn' })
    .eq('id', matchdayId)
  if (statusError) throw statusError

  return { repeatPairingsCount }
}
