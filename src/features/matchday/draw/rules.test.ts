import { describe, expect, it } from 'vitest'
import { pairKey } from './drawTeams'
import { DEFAULT_RULES, planDraw, type DrawContext, type DrawPlayer, type Position } from './rules'

const emptyContext = (): DrawContext => ({
  lastWeekPairs: new Set(),
  twoWeekPairs: new Set(),
  neverPairs: new Set(),
  cupWinners: new Set(),
  lastBest: new Set(),
  newcomers: new Set(),
  topScorers: new Set(),
})

function squad(n: number, position: (i: number) => Position | null = () => null, rating: (i: number) => number | null = () => null): DrawPlayer[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, position: position(i), rating: rating(i) }))
}

const teamOf = (teams: string[][], id: string) => teams.findIndex((t) => t.includes(id))

describe('planDraw', () => {
  it('puts every player on exactly one side of six', () => {
    const players = squad(30)
    const { teams } = planDraw(players, emptyContext(), DEFAULT_RULES)
    expect(teams).toHaveLength(5)
    expect(teams.every((t) => t.length === 6)).toBe(true)
    expect(teams.flat().sort()).toEqual(players.map((p) => p.id).sort())
  })

  it('handles a sixth side', () => {
    expect(planDraw(squad(36), emptyContext(), DEFAULT_RULES).teams).toHaveLength(6)
  })

  it('refuses a count that does not split into sides of six', () => {
    expect(() => planDraw(squad(29), emptyContext(), DEFAULT_RULES)).toThrow()
  })

  it('never puts a never-together pair on the same side', () => {
    const ctx = emptyContext()
    for (const [a, b] of [['p0', 'p1'], ['p2', 'p3'], ['p4', 'p5']]) ctx.neverPairs.add(pairKey(a, b))
    for (let run = 0; run < 10; run++) {
      const { teams, outcomes } = planDraw(squad(30), ctx, DEFAULT_RULES)
      expect(teamOf(teams, 'p0')).not.toBe(teamOf(teams, 'p1'))
      expect(teamOf(teams, 'p2')).not.toBe(teamOf(teams, 'p3'))
      expect(teamOf(teams, 'p4')).not.toBe(teamOf(teams, 'p5'))
      expect(outcomes.find((o) => o.rule === 'neverPairs')?.misses).toBe(0)
    }
  })

  it('gives each side one keeper when there are five', () => {
    const { teams } = planDraw(squad(30, (i) => (i < 5 ? 'GK' : 'UTIL')), emptyContext(), DEFAULT_RULES)
    expect(teams.map((t) => t.filter((id) => Number(id.slice(1)) < 5).length)).toEqual([1, 1, 1, 1, 1])
  })

  it('keeps the sides within a quarter point on rating', () => {
    const { teamRatings, outcomes } = planDraw(squad(30, () => null, (i) => 4 + (i % 6)), emptyContext(), DEFAULT_RULES)
    const ratings = teamRatings.map((r) => r!)
    expect(Math.max(...ratings) - Math.min(...ratings)).toBeLessThanOrEqual(0.25)
    expect(outcomes.find((o) => o.rule === 'ratings')?.misses).toBe(0)
  })

  it('switched-off rules are not reported', () => {
    const { outcomes } = planDraw(squad(30), emptyContext(), { ...DEFAULT_RULES, ratings: false, positions: false })
    expect(outcomes.map((o) => o.rule)).not.toContain('ratings')
    expect(outcomes.map((o) => o.rule)).not.toContain('positions')
  })
})
