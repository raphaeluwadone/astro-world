import { describe, expect, it, vi } from 'vitest'
import { cycleStandings, type CycleMatch } from './cycles'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

let day = 0
/** One filed match, as both sides see it. */
function match(a: string, b: string, goalsA: number, goalsB: number): CycleMatch[] {
  const played_at = new Date(Date.UTC(2026, 0, 1 + day++)).toISOString()
  return [
    { greek_name: a, opponent: b, played_at, goals_for: goalsA, goals_against: goalsB },
    { greek_name: b, opponent: a, played_at, goals_for: goalsB, goals_against: goalsA },
  ]
}

const order = (matches: CycleMatch[]) => cycleStandings(matches).map((r) => r.name)

describe('cycleStandings', () => {
  it('ranks by points: three for a win, one for a draw', () => {
    const table = cycleStandings([...match('Alpha', 'Beta', 2, 0), ...match('Gamma', 'Delta', 1, 1)])
    expect(table[0]).toMatchObject({ name: 'Alpha', points: 3, wins: 1, goalDifference: 2 })
    expect(table.find((r) => r.name === 'Gamma')).toMatchObject({ points: 1, draws: 1 })
    expect(table.find((r) => r.name === 'Beta')).toMatchObject({ points: 0, losses: 1 })
  })

  it('splits level points on goal difference', () => {
    const rows = [...match('Alpha', 'Gamma', 1, 0), ...match('Beta', 'Delta', 4, 0)]
    expect(order(rows).slice(0, 2)).toEqual(['Beta', 'Alpha'])
  })

  it('then on goals scored', () => {
    const rows = [...match('Alpha', 'Gamma', 3, 1), ...match('Beta', 'Delta', 2, 0)]
    expect(order(rows).slice(0, 2)).toEqual(['Alpha', 'Beta'])
  })

  it('then on head-to-head wins between the level sides', () => {
    const rows = [
      ...match('Alpha', 'Gamma', 2, 0),
      ...match('Alpha', 'Delta', 2, 0),
      ...match('Beta', 'Alpha', 1, 0),
      ...match('Beta', 'Epsilon', 3, 0),
      ...match('Delta', 'Beta', 1, 0),
    ]
    const table = cycleStandings(rows)
    const alpha = table.find((r) => r.name === 'Alpha')!
    const beta = table.find((r) => r.name === 'Beta')!
    expect([alpha.points, alpha.goalDifference, alpha.goalsFor]).toEqual([beta.points, beta.goalDifference, beta.goalsFor])
    expect(order(rows).slice(0, 2)).toEqual(['Beta', 'Alpha'])
  })

  it('lists every shirt, even without a game', () => {
    expect(order([])).toHaveLength(6)
  })
})
