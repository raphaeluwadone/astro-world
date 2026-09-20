import type { CupMatch, CupSquad } from './api'

export interface CupStandingRow {
  squadId: string
  name: string
  colour: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

/**
 * Points -> goal difference -> goals scored -> goals conceded. The
 * design's tiebreak chain goes on to head-to-head and then discipline
 * (cards), deliberately left out here: real per-player card data barely
 * exists yet (see project memory), and head-to-head needs its own
 * lookup for a case this rare. A genuine tie after goals conceded is
 * reported as a tie, not silently broken.
 */
export function computeCupStandings(squads: CupSquad[], matches: CupMatch[]): CupStandingRow[] {
  const rows = new Map<string, CupStandingRow>(
    squads.map((s) => [
      s.id,
      { squadId: s.id, name: s.name, colour: s.colour, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    ]),
  )

  for (const m of matches) {
    if (m.score_a == null || m.score_b == null) continue
    const a = rows.get(m.squad_a_id)
    const b = rows.get(m.squad_b_id)
    if (!a || !b) continue

    a.played++
    b.played++
    a.goalsFor += m.score_a
    a.goalsAgainst += m.score_b
    b.goalsFor += m.score_b
    b.goalsAgainst += m.score_a

    if (m.score_a > m.score_b) {
      a.won++
      a.points += 3
      b.lost++
    } else if (m.score_a < m.score_b) {
      b.won++
      b.points += 3
      a.lost++
    } else {
      a.drawn++
      b.drawn++
      a.points++
      b.points++
    }
  }

  for (const r of rows.values()) {
    r.goalDifference = r.goalsFor - r.goalsAgainst
  }

  return [...rows.values()].sort(
    (x, y) => y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor || x.goalsAgainst - y.goalsAgainst,
  )
}
