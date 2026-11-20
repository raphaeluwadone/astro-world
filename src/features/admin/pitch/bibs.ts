import type { TeamWithMembers } from '@/features/matchday/api'
import type { PitchGame } from './api'

export const BIBS = [
  { key: 'blue', label: 'Blue', colour: '#2f7df6', ink: '#04121d' },
  { key: 'red', label: 'Red', colour: '#e0483f', ink: '#04121d' },
  { key: 'yellow', label: 'Yellow', colour: '#facc15', ink: '#04121d' },
  { key: 'green', label: 'Green', colour: '#4ade80', ink: '#04121d' },
  { key: 'orange', label: 'Orange', colour: '#f2a93b', ink: '#04121d' },
  { key: 'white', label: 'White', colour: '#e8ebf5', ink: '#04121d' },
  { key: 'black', label: 'Black', colour: '#3a4166', ink: '#eef0f9' },
] as const

export type BibKey = (typeof BIBS)[number]['key']
export type BibPair = [BibKey, BibKey]

export const DEFAULT_BIBS: BibPair = ['blue', 'red']

export const bibFor = (key: string | null | undefined) => BIBS.find((b) => b.key === key)

export type SideTeam = TeamWithMembers & { bib?: (typeof BIBS)[number] }

/** The game's two sides wearing their bib colours; everyone else untouched. A side with no bib keeps its team colour. */
export function withBibs(game: Pick<PitchGame, 'team_a_id' | 'team_b_id' | 'bib_a' | 'bib_b'>, teams: TeamWithMembers[]): SideTeam[] {
  const bibs: Record<string, ReturnType<typeof bibFor>> = { [game.team_a_id]: bibFor(game.bib_a), [game.team_b_id]: bibFor(game.bib_b) }
  return teams.map((t) => {
    const bib = bibs[t.id]
    return bib ? { ...t, colour: bib.colour, bib } : t
  })
}

/** Winner stays on, so a side that played last game keeps its bibs and the challenger takes the other set. */
export function nextBibs(picked: string[], last: PitchGame | undefined): BibPair {
  const a = bibFor(last?.bib_a)?.key
  const b = bibFor(last?.bib_b)?.key
  if (!last || !a || !b || picked.length !== 2) return DEFAULT_BIBS
  const worn: Record<string, BibKey> = { [last.team_a_id]: a, [last.team_b_id]: b }
  const other = (c: BibKey) => (c === a ? b : a)
  const [x, y] = picked
  if (worn[x] && !worn[y]) return [worn[x], other(worn[x])]
  if (worn[y] && !worn[x]) return [other(worn[y]), worn[y]]
  if (worn[x] && worn[y]) return [worn[x], worn[y]]
  return [a, b]
}
