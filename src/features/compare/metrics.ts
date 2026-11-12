import type { CompareRow, CompareScope } from './api'

export const PICK_COLOURS = ['#a63fff', '#38bdf8', '#4ade80', '#f2a93b']
export const MAX_PICKS = 4

export interface Theme {
  colours: string[]
  accent: string
  soft: string
  /** The accent as "r,g,b" for translucent tints. */
  rgb: string
}

const SUNDAY_THEME: Theme = { colours: PICK_COLOURS, accent: '#a63fff', soft: '#c589ff', rgb: '166,63,255' }
const CUP_THEME: Theme = { colours: ['#f2a93b', '#38bdf8', '#4ade80', '#c589ff'], accent: '#f2a93b', soft: '#ffc977', rgb: '242,169,59' }

export const keeps = (p: CompareRow) => p.positions.includes('GK') || p.positions.includes('DEF')
export const isKeeper = (p: CompareRow) => p.positions.includes('GK')

const per = (n: number, d: number) => (d > 0 ? n / d : null)
const two = (v: number) => v.toFixed(2)
const one = (v: number) => v.toFixed(1)
const pct = (v: number) => `${Math.round(v * 100)}%`
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export interface Metric {
  label: string
  note: string
  get: (p: CompareRow) => number | null
  fmt?: (v: number) => string
  /** Shown but never "won", e.g. appearances. */
  neutral?: boolean
  keepersOnly?: boolean
}

export interface Axis {
  label: string
  get: (p: CompareRow) => number
}

export interface ScopeConfig {
  theme: Theme
  minGames: number
  games: (p: CompareRow) => number
  rows: Metric[]
  /** Six spokes for the hexagon, clockwise from the top. */
  axes: Axis[]
  scatter: {
    x: (p: CompareRow) => number
    y: (p: CompareRow) => number
    xLabel: string
    yLabel: string
    rates: number[]
    rateLabel: string
    note: string
  }
  rank: { title: string; note: string; get: (p: CompareRow) => number; fmt: (v: number) => string }
  summary: (p: CompareRow) => string
  verdict: (a: CompareRow, b: CompareRow) => string
  footnote: string
}

const ga = (p: CompareRow) => p.goals + p.assists

function sundayVerdict(a: CompareRow, b: CompareRow) {
  const aPer = per(ga(a), a.apps)
  const bPer = per(ga(b), b.apps)
  if (aPer === null || bPer === null) {
    const missing = aPer === null ? a : b
    return `${missing.nickname} hasn't played in this stretch, so there's nothing to set against ${(missing === a ? b : a).nickname}.`
  }
  const scorer = (per(a.goals, a.apps) ?? 0) >= (per(b.goals, b.apps) ?? 0) ? a : b
  const creator = (per(a.assists, a.apps) ?? 0) >= (per(b.assists, b.apps) ?? 0) ? a : b
  const better = aPer >= bPer ? a : b
  const worse = better === a ? b : a
  const gap = Math.abs(aPer - bPer)
  const betterPer = per(ga(better), better.apps) ?? 0
  const worsePer = per(ga(worse), worse.apps) ?? 0
  if (scorer !== creator) {
    return `${scorer.nickname} scores more, ${creator.nickname} makes more. ${
      gap < 0.15
        ? `On G+A per game there's nothing between them: ${two(gap)} a game.`
        : `${better.nickname} comes out ahead overall, ${two(betterPer)} to ${two(worsePer)}.`
    }`
  }
  return `${scorer.nickname} does both: ${count(scorer.goals, 'goal')} and ${count(scorer.assists, 'assist')} in ${count(scorer.apps, 'game')}. ${
    gap < 0.15 ? `The per-game gap is only ${two(gap)} though.` : `${worse.nickname} isn't close on this one.`
  }`
}

function cupVerdict(a: CompareRow, b: CompareRow) {
  if (!a.cupsPlayed && !b.cupsPlayed) return 'Neither has played a Salami Cup yet.'
  if (!a.cupsPlayed || !b.cupsPlayed) {
    const has = a.cupsPlayed ? a : b
    const not = has === a ? b : a
    return `${not.nickname} hasn't played a Salami Cup yet, so this one is all ${has.nickname}.`
  }
  const titles =
    a.cupsWon === b.cupsWon
      ? a.cupsWon
        ? `Level on titles, ${a.cupsWon} each.`
        : 'Neither has lifted one yet.'
      : `${(a.cupsWon > b.cupsWon ? a : b).nickname} has more silverware, ${Math.max(a.cupsWon, b.cupsWon)} to ${Math.min(a.cupsWon, b.cupsWon)}.`
  const aRate = per(a.cupGoals, a.cupGames) ?? 0
  const bRate = per(b.cupGoals, b.cupGames) ?? 0
  const goals =
    aRate === bRate
      ? aRate
        ? 'Same return in front of goal.'
        : 'No cup goals between them so far.'
      : `${(aRate > bRate ? a : b).nickname} scores more per cup game, ${two(Math.max(aRate, bRate))} to ${two(Math.min(aRate, bRate))}.`
  return `${titles} ${goals}`
}

function sundayConfig(scope: 'season' | 'career'): ScopeConfig {
  const season = scope === 'season'
  return {
    theme: SUNDAY_THEME,
    minGames: season ? 3 : 10,
    games: (p) => p.apps,
    rows: [
      { label: 'Appearances', note: season ? 'Games this season' : 'Including the almanac', get: (p) => p.apps, neutral: true },
      { label: 'Goals', note: season ? 'Sundays only, own goals taken off' : 'Cup goals in, own goals taken off', get: (p) => p.goals },
      { label: 'Own goals', note: 'Into their own net', get: (p) => p.ownGoals, neutral: true },
      { label: 'Assists', note: 'As credited by the scorer', get: (p) => p.assists },
      { label: 'G + A', note: 'Total involvement', get: ga },
      { label: 'G+A per game', note: 'The one that matters', get: (p) => per(ga(p), p.apps), fmt: two },
      { label: 'Clean sheets', note: 'Keepers and defenders only', get: (p) => (keeps(p) ? p.cleanSheets : null), keepersOnly: true },
      { label: 'Avg rating', note: 'Voted by whoever played with them', get: (p) => p.rating, fmt: one },
      { label: 'MOTM', note: 'Man of the Match wins', get: (p) => p.motm },
    ],
    axes: [
      { label: 'Goals', get: (p) => per(p.goals, p.apps) ?? 0 },
      { label: 'Assists', get: (p) => per(p.assists, p.apps) ?? 0 },
      { label: 'Rating', get: (p) => p.rating ?? 0 },
      { label: 'Turnout', get: (p) => p.apps },
      { label: 'Clean sheets', get: (p) => (keeps(p) ? (per(p.cleanSheets, p.apps) ?? 0) : 0) },
      { label: 'MOTM', get: (p) => per(p.motm, p.apps) ?? 0 },
    ],
    scatter: {
      x: (p) => p.apps,
      y: (p) => Math.max(0, ga(p)),
      xLabel: 'Appearances',
      yLabel: 'Goals + assists',
      rates: [0.5, 1, 1.5],
      rateLabel: 'a game',
      note: 'Tap any dot to add them to the shortlist. Dotted lines are G+A per game.',
    },
    rank: {
      title: season ? 'G+A per game this season' : 'G+A per game, all time',
      note: 'Your shortlist stays coloured in place.',
      get: (p) => per(ga(p), p.apps) ?? 0,
      fmt: two,
    },
    summary: (p) => `${p.apps} apps · ${ga(p)} G+A · ${p.rating != null ? `${one(p.rating)} avg` : 'no rating yet'}`,
    verdict: sundayVerdict,
    footnote: season
      ? 'Appearances are shown but never won. Monthly members play every Sunday by paying early, so turning up more says as much about your wallet as your football.'
      : 'Career figures include the almanac records from before the app, and career goals include Salami Cup goals. Ratings only started with the app, so career ratings cover fewer games.',
  }
}

const cupConfig: ScopeConfig = {
  theme: CUP_THEME,
  minGames: 1,
  games: (p) => p.cupGames,
  rows: [
    { label: 'Cups played', note: 'Salami Cups entered', get: (p) => p.cupsPlayed, neutral: true },
    { label: 'Cups won', note: 'Silverware', get: (p) => p.cupsWon },
    { label: 'Cup games', note: 'Fixtures played', get: (p) => p.cupGames, neutral: true },
    { label: 'Cup wins', note: 'Fixtures won', get: (p) => p.cupWins },
    { label: 'Win rate', note: 'Wins per cup game', get: (p) => per(p.cupWins, p.cupGames), fmt: pct },
    { label: 'Cup goals', note: 'Own goals taken off', get: (p) => p.cupGoals },
    { label: 'Own goals', note: 'Into their own net', get: (p) => p.cupOwnGoals, neutral: true },
    { label: 'Goals per game', note: 'In cup fixtures', get: (p) => per(p.cupGoals, p.cupGames), fmt: two },
    { label: 'Clean sheets', note: 'Keepers and defenders only', get: (p) => (keeps(p) ? p.cupCleanSheets : null), keepersOnly: true },
    { label: 'Cup Hero', note: 'Top scorer of a cup', get: (p) => p.cupHeroes },
  ],
  axes: [
    { label: 'Goals', get: (p) => per(p.cupGoals, p.cupGames) ?? 0 },
    { label: 'Wins', get: (p) => per(p.cupWins, p.cupGames) ?? 0 },
    { label: 'Titles', get: (p) => p.cupsWon },
    { label: 'Turnout', get: (p) => p.cupsPlayed },
    { label: 'Clean sheets', get: (p) => (keeps(p) ? (per(p.cupCleanSheets, p.cupGames) ?? 0) : 0) },
    { label: 'Cup Hero', get: (p) => p.cupHeroes },
  ],
  scatter: {
    x: (p) => p.cupGames,
    y: (p) => Math.max(0, p.cupGoals),
    xLabel: 'Cup games',
    yLabel: 'Cup goals',
    rates: [0.5, 1],
    rateLabel: 'a game',
    note: 'Tap any dot to add them to the shortlist. Dotted lines are goals per cup game.',
  },
  rank: {
    title: 'Cup wins, all cups',
    note: 'Fixtures won across every Salami Cup. Your shortlist stays coloured in place.',
    get: (p) => p.cupWins,
    fmt: String,
  },
  summary: (p) => `${p.cupsPlayed} cups · ${p.cupsWon} won · ${p.cupGoals} goals`,
  verdict: cupVerdict,
  footnote:
    'Cup numbers stay with the cup. Cup goals count toward career goals, but never toward the monthly or yearly awards, and nothing from Sundays shows up here.',
}

const CONFIGS: Record<CompareScope, ScopeConfig> = {
  season: sundayConfig('season'),
  career: sundayConfig('career'),
  cup: cupConfig,
}

export const scopeConfig = (scope: CompareScope) => CONFIGS[scope]

/** The highest value of each axis across the group, so a full spoke means nobody does more of it. */
export function axisMaxima(config: ScopeConfig, rows: CompareRow[]) {
  const pool = rows.filter((p) => config.games(p) >= config.minGames)
  const source = pool.length ? pool : rows
  return config.axes.map((a) => Math.max(0, ...source.map(a.get)) || 1)
}

/** Picks holding the best value, or none when everyone is level. */
export function winners(values: Array<number | null>) {
  const valid = values.filter((v): v is number => v !== null)
  const best = Math.max(...valid)
  if (valid.length < 2 || valid.every((v) => v === best)) return new Set<number>()
  return new Set(values.flatMap((v, i) => (v === best ? [i] : [])))
}

/** A round axis top and five evenly spaced ticks. */
export function niceTicks(max: number) {
  const step = Math.max(1, Math.ceil(max / 4))
  return [0, 1, 2, 3, 4].map((n) => n * step)
}

export interface ViewProps {
  picks: CompareRow[]
  rows: CompareRow[]
  config: ScopeConfig
  onToggle: (id: string) => void
}

export const nextPicks = (picks: string[], id: string) =>
  picks.includes(id) ? picks.filter((x) => x !== id) : picks.length < MAX_PICKS ? [...picks, id] : [...picks.slice(1), id]
