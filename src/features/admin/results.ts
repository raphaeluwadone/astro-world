import { supabase } from '@/lib/supabase'

export interface GoalInput {
  teamId: string
  scorerId: string
  assistId: string | null
  minute: number
}

export interface FixtureInput {
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
  goals: GoalInput[]
}

/** Nothing has ever actually filed a matchday's results before: matches,
 * goals and match_players were only ever created by hand via SQL for
 * testing. This is the real admin action, not a queue/fixture generator
 * (the winner-stays-on queue format was deliberately left unmodelled
 * early in this project) — the admin just records whatever fixtures
 * actually happened. Everyone drawn into either side is recorded as
 * having played; there's no pitch-side substitution flow yet. */
export async function fileMatchdayResults(matchdayId: string, fixtures: FixtureInput[]) {
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
      (members ?? []).map((m) => ({ match_id: match.id, player_id: m.player_id, team_id: m.team_id })),
    )
    if (playersError) throw playersError

    if (fixture.goals.length > 0) {
      const { error: goalsError } = await supabase.from('goals').insert(
        fixture.goals.map((g) => ({
          match_id: match.id,
          team_id: g.teamId,
          scorer_id: g.scorerId,
          assist_id: g.assistId,
          minute: g.minute,
        })),
      )
      if (goalsError) throw goalsError
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
