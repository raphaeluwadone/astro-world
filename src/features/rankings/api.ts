import { currentSeasonStart } from '@/lib/season'
import { supabase } from '@/lib/supabase'
import { TEAM_ID } from '@/lib/teamId'
import type { Database } from '@/types/database'

type PositionType = Database['public']['Enums']['position_type']

export type MatchResult = 'W' | 'D' | 'L'

export interface TeamStandingRow {
  name: string
  glyph: string
  colour: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  /** Most recent first, capped at 5. */
  form: MatchResult[]
}

export interface RankingRow {
  id: string
  nickname: string
  full_name: string
  positions: PositionType[]
  appearances: number
  goals: number
  assists: number
  motm_count: number
  avg_rating: number | null
}

const MIN_APPEARANCES = 5

export async function fetchRankings(): Promise<RankingRow[]> {
  const [{ data: players, error: playersError }, { data: stats, error: statsError }] = await Promise.all([
    supabase.from('players').select('id, nickname, full_name, positions'),
    supabase.rpc('player_career_stats'),
  ])
  if (playersError) throw playersError
  if (statsError) throw statsError

  const statsByPlayer = new Map((stats ?? []).map((s) => [s.player_id, s]))

  return (players ?? [])
    .map((p) => {
      const s = statsByPlayer.get(p.id)
      return {
        ...p,
        appearances: s?.appearances ?? 0,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
        motm_count: s?.motm_count ?? 0,
        avg_rating: s?.avg_rating ?? null,
      }
    })
    .filter((r) => r.appearances >= MIN_APPEARANCES)
}

/** All six sides, even ones that haven't played this season (P=0):
 * "the six sides run all season" even though only 5 usually turn out.
 * League points are never stored (BACKEND.md is explicit: derive from
 * results, a running total drifts once a result gets corrected), so this
 * aggregates the raw per-side match rows fresh every time. */
export async function fetchSeasonTeamStandings(): Promise<TeamStandingRow[]> {
  const { data, error } = await supabase.rpc('season_team_matches', {
    p_season_start: currentSeasonStart().toISOString(),
  })
  if (error) throw error

  const byName = new Map<string, Array<{ playedAt: string; goalsFor: number; goalsAgainst: number }>>()
  for (const row of data ?? []) {
    const list = byName.get(row.greek_name) ?? []
    list.push({ playedAt: row.played_at, goalsFor: row.goals_for, goalsAgainst: row.goals_against })
    byName.set(row.greek_name, list)
  }

  return TEAM_ID.map((t) => {
    const matches = (byName.get(t.name) ?? []).sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    )
    let wins = 0
    let draws = 0
    let losses = 0
    let goalsFor = 0
    let goalsAgainst = 0
    const form: MatchResult[] = []
    for (const m of matches) {
      goalsFor += m.goalsFor
      goalsAgainst += m.goalsAgainst
      const result: MatchResult = m.goalsFor > m.goalsAgainst ? 'W' : m.goalsFor === m.goalsAgainst ? 'D' : 'L'
      if (result === 'W') wins++
      else if (result === 'D') draws++
      else losses++
      if (form.length < 5) form.push(result)
    }
    return {
      name: t.name,
      glyph: t.glyph,
      colour: t.colour,
      played: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
      form,
    }
  }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
}
