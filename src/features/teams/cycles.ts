import { supabase } from '@/lib/supabase'
import { TEAM_ID } from '@/lib/teamId'
import type { MatchResult, TeamStandingRow } from '@/features/rankings/api'

export interface TeamCycle {
  id: string
  label: string
  starts_at: string
  ends_at: string
  closed_at: string | null
  champion: string | null
  final_table: FinalRow[] | null
}

/** ends_at is the midnight after the cycle, so the last day it covers is the one before. */
export function cycleLastDay(endsAt: string) {
  return new Date(new Date(endsAt).getTime() - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })
}

export interface FinalRow {
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

export interface CycleMatch {
  greek_name: string
  opponent: string
  played_at: string
  goals_for: number
  goals_against: number
}

export async function fetchCycles(): Promise<TeamCycle[]> {
  const { data, error } = await supabase.from('team_cycles').select('id, label, starts_at, ends_at, closed_at, champion, final_table').order('starts_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as TeamCycle[]
}

export async function fetchCycleMatches(cycle: TeamCycle): Promise<CycleMatch[]> {
  const { data, error } = await supabase.rpc('team_matches_between', { p_from: cycle.starts_at, p_to: cycle.closed_at ?? cycle.ends_at })
  if (error) throw error
  return data ?? []
}

const result = (m: CycleMatch): MatchResult => (m.goals_for > m.goals_against ? 'W' : m.goals_for === m.goals_against ? 'D' : 'L')

/** Head-to-head wins inside a group of teams that are otherwise level. */
function headToHeadWins(group: string[], matches: CycleMatch[]) {
  const wins = new Map(group.map((n) => [n, 0]))
  for (const m of matches) if (group.includes(m.greek_name) && group.includes(m.opponent) && result(m) === 'W') wins.set(m.greek_name, wins.get(m.greek_name)! + 1)
  return wins
}

/** Points, then goal difference, goals for, fewest conceded, then head-to-head wins between the level sides. */
export function cycleStandings(matches: CycleMatch[]): TeamStandingRow[] {
  const rows = TEAM_ID.map((t): TeamStandingRow => {
    const mine = matches.filter((m) => m.greek_name === t.name).sort((a, b) => b.played_at.localeCompare(a.played_at))
    const count = (r: MatchResult) => mine.filter((m) => result(m) === r).length
    const goalsFor = mine.reduce((s, m) => s + m.goals_for, 0)
    const goalsAgainst = mine.reduce((s, m) => s + m.goals_against, 0)
    return {
      name: t.name,
      glyph: t.glyph,
      colour: t.colour,
      played: mine.length,
      wins: count('W'),
      draws: count('D'),
      losses: count('L'),
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: count('W') * 3 + count('D'),
      form: mine.slice(0, 5).map(result),
    }
  })

  const level = (a: TeamStandingRow, b: TeamStandingRow) =>
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.goalsAgainst - b.goalsAgainst
  rows.sort(level)

  const out: TeamStandingRow[] = []
  for (let i = 0; i < rows.length; ) {
    let j = i + 1
    while (j < rows.length && level(rows[i], rows[j]) === 0) j++
    const group = rows.slice(i, j)
    if (group.length > 1) {
      const h2h = headToHeadWins(group.map((r) => r.name), matches)
      group.sort((a, b) => h2h.get(b.name)! - h2h.get(a.name)!)
    }
    out.push(...group)
    i = j
  }
  return out
}

export function toFinalTable(rows: TeamStandingRow[]): FinalRow[] {
  return rows.map((r) => ({ name: r.name, played: r.played, won: r.wins, drawn: r.draws, lost: r.losses, gf: r.goalsFor, ga: r.goalsAgainst, points: r.points }))
}

export async function closeCycle(champion: string, table: FinalRow[], nextLabel: string, nextEndsAt: string) {
  const { error } = await supabase.rpc('close_team_cycle', { p_champion: champion, p_final_table: table as never, p_next_label: nextLabel, p_next_ends_at: nextEndsAt })
  if (error) throw error
}

/** Every closed cycle's champion, newest first. */
export function championsOf(cycles: TeamCycle[]) {
  return cycles.filter((c) => c.champion)
}
