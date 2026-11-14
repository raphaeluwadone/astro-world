import { supabase } from '@/lib/supabase'

export interface GoalInput {
  teamId: string
  scorerId: string
  assistId: string | null
  ownGoal: boolean
}

export interface CardInput {
  teamId: string
  playerId: string
  kind: 'yellow' | 'red'
  minute: number | null
}

export interface FixtureInput {
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
  goals: GoalInput[]
  /** Yellows and straight reds; the red for a second yellow is added by the database. */
  cards: CardInput[]
}

/** Records whatever fixtures actually happened. Each side's drawn members count as having played,
 * narrowed to those checked in on Pitch-side when anyone was. */
export async function fileMatchdayResults(matchdayId: string, fixtures: FixtureInput[], checkedIn: string[] = []) {
  const here = new Set(checkedIn)
  for (const fixture of fixtures) {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        matchday_id: matchdayId,
        team_a_id: fixture.teamAId,
        team_b_id: fixture.teamBId,
        score_a: fixture.scoreA,
        score_b: fixture.scoreB,
      })
      .select('id')
      .single()
    if (matchError) throw matchError

    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('team_id, player_id')
      .in('team_id', [fixture.teamAId, fixture.teamBId])
    if (membersError) throw membersError

    const { error: playersError } = await supabase.from('match_players').insert(
      (members ?? [])
        .filter((m) => here.size === 0 || here.has(m.player_id))
        .map((m) => ({ match_id: match.id, player_id: m.player_id, team_id: m.team_id })),
    )
    if (playersError) throw playersError

    if (fixture.goals.length > 0) {
      const { error: goalsError } = await supabase.from('goals').insert(
        fixture.goals.map((g) => ({
          match_id: match.id,
          team_id: g.teamId,
          scorer_id: g.scorerId,
          assist_id: g.assistId,
          own_goal: g.ownGoal,
        })),
      )
      if (goalsError) throw goalsError
    }

    if (fixture.cards.length > 0) {
      const { error: cardsError } = await supabase.from('cards').insert(
        fixture.cards.map((c) => ({ match_id: match.id, team_id: c.teamId, player_id: c.playerId, kind: c.kind, minute: c.minute })),
      )
      if (cardsError) throw cardsError
    }
  }

  const { error: statusError } = await supabase
    .from('matchdays')
    .update({ status: 'played' })
    .eq('id', matchdayId)
  if (statusError) throw statusError
}

export async function cancelMatchday(matchdayId: string) {
  const { error } = await supabase.from('matchdays').update({ status: 'cancelled' }).eq('id', matchdayId)
  if (error) throw error
}
