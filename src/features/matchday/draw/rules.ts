import { pairKey, shuffle } from './drawTeams'

export type RatingWindow = 'last_week' | 'last_month' | 'last_3_months' | 'season' | 'all'

export interface DrawRules {
  freshPairs: boolean
  noThreeWeeks: boolean
  neverPairs: boolean
  positions: boolean
  ratings: boolean
  ratingWindow: RatingWindow
  splitCupWinners: boolean
  splitLastBest: boolean
  spreadNewcomers: boolean
  spreadScorers: boolean
}

export const DEFAULT_RULES: DrawRules = {
  freshPairs: true,
  noThreeWeeks: true,
  neverPairs: true,
  positions: true,
  ratings: true,
  ratingWindow: 'season',
  splitCupWinners: false,
  splitLastBest: false,
  spreadNewcomers: false,
  spreadScorers: false,
}

export const RATING_WINDOWS: { value: RatingWindow; label: string }[] = [
  { value: 'last_week', label: 'Last game week' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'season', label: 'This season' },
  { value: 'all', label: 'All time' },
]

export type Position = 'GK' | 'DEF' | 'ATT' | 'UTIL'

export interface DrawPlayer {
  id: string
  /** First listed position counts; UTIL fits anywhere. */
  position: Position | null
  rating: number | null
}

export interface DrawContext {
  lastWeekPairs: Set<string>
  /** Pairs who were together in each of the last two matchdays. */
  twoWeekPairs: Set<string>
  neverPairs: Set<string>
  cupWinners: Set<string>
  lastBest: Set<string>
  newcomers: Set<string>
  topScorers: Set<string>
}

export type RuleKey = Exclude<keyof DrawRules, 'ratingWindow'>

// Balance outweighs the people rules, as asked; never-together is effectively hard.
const WEIGHT: Record<RuleKey, number> = {
  neverPairs: 10_000,
  positions: 120,
  ratings: 150,
  noThreeWeeks: 60,
  splitCupWinners: 40,
  splitLastBest: 40,
  spreadNewcomers: 40,
  spreadScorers: 40,
  freshPairs: 4,
}

export interface RuleOutcome {
  rule: RuleKey
  /** 0 means fully met. */
  misses: number
}

export interface DrawPlan {
  teams: string[][]
  outcomes: RuleOutcome[]
  teamRatings: (number | null)[]
  teamPositions: Record<Position, number>[]
}

function pairsHit(teams: string[][], set: Set<string>) {
  let n = 0
  for (const t of teams) for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (set.has(pairKey(t[i], t[j]))) n++
  return n
}

/** How many players sit above an even share of `group` per team. */
function overflow(teams: string[][], group: Set<string>) {
  if (group.size === 0) return 0
  const cap = Math.ceil(group.size / teams.length)
  return teams.reduce((sum, t) => sum + Math.max(0, t.filter((id) => group.has(id)).length - cap), 0)
}

function positionsOf(team: string[], byId: Map<string, DrawPlayer>) {
  const counts: Record<Position, number> = { GK: 0, DEF: 0, ATT: 0, UTIL: 0 }
  for (const id of team) {
    const p = byId.get(id)?.position
    if (p) counts[p]++
  }
  return counts
}

function positionMisses(teams: string[][], byId: Map<string, DrawPlayer>) {
  let misses = 0
  for (const pos of ['GK', 'DEF', 'ATT'] as const) {
    const counts = teams.map((t) => positionsOf(t, byId)[pos])
    const total = counts.reduce((a, b) => a + b, 0)
    const lo = Math.floor(total / teams.length)
    const hi = Math.ceil(total / teams.length)
    // Keepers count double: a side with two and a side with none is the worst outcome.
    const weight = pos === 'GK' ? 2 : 1
    misses += weight * counts.reduce((sum, c) => sum + Math.max(0, c - hi) + Math.max(0, lo - c), 0)
  }
  return misses
}

function teamRating(team: string[], byId: Map<string, DrawPlayer>, fallback: number) {
  return team.reduce((s, id) => s + (byId.get(id)?.rating ?? fallback), 0) / team.length
}

function evaluate(teams: string[][], players: Map<string, DrawPlayer>, ctx: DrawContext, rules: DrawRules, fallback: number) {
  const outcomes: RuleOutcome[] = []
  let cost = 0
  const add = (rule: RuleKey, misses: number, raw = misses) => {
    outcomes.push({ rule, misses })
    cost += WEIGHT[rule] * raw
  }
  if (rules.neverPairs) add('neverPairs', pairsHit(teams, ctx.neverPairs))
  if (rules.positions) add('positions', positionMisses(teams, players))
  if (rules.ratings) {
    const avgs = teams.map((t) => teamRating(t, players, fallback))
    const spread = Math.max(...avgs) - Math.min(...avgs)
    // Under a quarter of a point between best and worst side counts as balanced.
    add('ratings', spread > 0.25 ? Math.round(spread * 100) / 100 : 0, spread)
  }
  if (rules.noThreeWeeks) add('noThreeWeeks', pairsHit(teams, ctx.twoWeekPairs))
  if (rules.splitCupWinners) add('splitCupWinners', overflow(teams, ctx.cupWinners))
  if (rules.splitLastBest) add('splitLastBest', overflow(teams, ctx.lastBest))
  if (rules.spreadNewcomers) add('spreadNewcomers', overflow(teams, ctx.newcomers))
  if (rules.spreadScorers) add('spreadScorers', overflow(teams, ctx.topScorers))
  if (rules.freshPairs) add('freshPairs', pairsHit(teams, ctx.lastWeekPairs))
  return { cost, outcomes }
}

function chunk(ids: string[], size: number) {
  const out: string[][] = []
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size))
  return out
}

/**
 * Random starts, each improved by swapping players between sides while the score drops.
 * Every run starts from a fresh shuffle, so a re-roll gives a different, equally good split.
 */
export function planDraw(players: DrawPlayer[], ctx: DrawContext, rules: DrawRules, { teamSize = 6, starts = 20, swaps = 1500 } = {}): DrawPlan {
  if (players.length === 0 || players.length % teamSize !== 0) throw new Error(`Expected a multiple of ${teamSize} players, got ${players.length}`)
  const byId = new Map(players.map((p) => [p.id, p]))
  const rated = players.filter((p) => p.rating != null)
  const fallback = rated.length ? rated.reduce((s, p) => s + p.rating!, 0) / rated.length : 0
  const ids = players.map((p) => p.id)

  let best: { teams: string[][]; cost: number } | null = null
  for (let s = 0; s < starts; s++) {
    const teams = chunk(shuffle(ids), teamSize)
    let cost = evaluate(teams, byId, ctx, rules, fallback).cost
    for (let k = 0; k < swaps && cost > 0; k++) {
      const a = Math.floor(Math.random() * teams.length)
      let b = Math.floor(Math.random() * (teams.length - 1))
      if (b >= a) b++
      const i = Math.floor(Math.random() * teamSize)
      const j = Math.floor(Math.random() * teamSize)
      ;[teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]]
      const next = evaluate(teams, byId, ctx, rules, fallback).cost
      if (next <= cost) cost = next
      else [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]]
    }
    if (!best || cost < best.cost) best = { teams: teams.map((t) => [...t]), cost }
    if (best.cost === 0) break
  }

  const teams = best!.teams
  return {
    teams,
    outcomes: evaluate(teams, byId, ctx, rules, fallback).outcomes,
    teamRatings: teams.map((t) => (rated.length ? Math.round(teamRating(t, byId, fallback) * 100) / 100 : null)),
    teamPositions: teams.map((t) => positionsOf(t, byId)),
  }
}

export function pairSet(teams: string[][]) {
  const set = new Set<string>()
  for (const t of teams) for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) set.add(pairKey(t[i], t[j]))
  return set
}
