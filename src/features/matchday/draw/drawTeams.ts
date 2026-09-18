/**
 * The team-draw algorithm. See project memory / conversation for the
 * full problem statement — short version: split 30 balloted players
 * into 5 random teams of 6, minimizing how many pairs of players end up
 * together again from last week. Zero repeat pairings isn't always
 * possible, so this reports how many it couldn't avoid rather than
 * assuming it always finds a perfect split.
 *
 * pairKey and shuffle were written by Raphael (paired, reviewed line by
 * line); partitionIntoTeams, countRepeatPairings and drawTeams below
 * were then written by Claude at Raphael's request, with a walkthrough
 * to follow.
 *
 * PROVEN MATHEMATICAL FLOOR, not an implementation gap: whenever 6 or
 * more people from the SAME previous team all return the following
 * week, at least one repeat pairing among them is unavoidable — there
 * are only 5 teams to split them across, so by the pigeonhole
 * principle at least two of them must land on the same new team. This
 * was verified empirically (300,000 attempts still capped at exactly
 * the predicted minimum) before being written down here. Don't "fix"
 * a non-zero repeatPairingsCount by raising maxAttempts further in a
 * case like this — it's not stuck, it's already optimal.
 */

const TEAM_COUNT = 5
const TEAM_SIZE = 6

/**
 * A canonical, order-independent key for a pair of player ids, so
 * "A paired with B" and "B paired with A" are the same entry in a Set.
 *
 * TODO(Raphael): implement this.
 */
export function pairKey(playerA: string, playerB: string): string {
  return playerA < playerB ? `${playerA}-${playerB}` : `${playerB}-${playerA}`
}

/**
 * Returns a new array containing the same elements as `items`, in a
 * uniformly random order. Must not mutate the input array.
 *
 * TODO(Raphael): implement this. Worth knowing before you start: the
 * common one-liner `array.sort(() => Math.random() - 0.5)` is a real,
 * well-documented bias trap — it does NOT produce a uniform shuffle.
 * We'll talk through why, and the standard correct algorithm, before
 * you write this one.
 */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Splits an already-shuffled array of 30 player ids into 5 teams of 6,
 * in order (first 6 -> team 0, next 6 -> team 1, ...).
 */
export function partitionIntoTeams(shuffledPlayerIds: string[]): string[][] {
  const teams: string[][] = []
  for (let team = 0; team < TEAM_COUNT; team++) {
    teams.push(shuffledPlayerIds.slice(team * TEAM_SIZE, (team + 1) * TEAM_SIZE))
  }
  return teams
}

/**
 * Counts how many pairs across all teams also appear in
 * `previousPairings` — i.e. how many pairs of players are repeating
 * from last week's teams.
 */
export function countRepeatPairings(teams: string[][], previousPairings: Set<string>): number {
  let repeatCount = 0
  for (const team of teams) {
    // every unordered pair within this team of 6 — 15 pairs per team
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        if (previousPairings.has(pairKey(team[i], team[j]))) {
          repeatCount++
        }
      }
    }
  }
  return repeatCount
}

export interface DrawResult {
  teams: string[][]
  repeatPairingsCount: number
}

/**
 * The full algorithm: shuffle + partition + score, repeated up to
 * `maxAttempts` times, keeping the best (lowest-scoring) attempt seen.
 * Stops early if it finds a perfect (zero repeat pairings) split.
 */
export function drawTeams(
  playerIds: string[],
  previousPairings: Set<string>,
  maxAttempts = 2000,
): DrawResult {
  if (playerIds.length !== TEAM_COUNT * TEAM_SIZE) {
    throw new Error(`Expected exactly ${TEAM_COUNT * TEAM_SIZE} players, got ${playerIds.length}`)
  }

  let best: DrawResult | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const teams = partitionIntoTeams(shuffle(playerIds))
    const repeatPairingsCount = countRepeatPairings(teams, previousPairings)

    if (!best || repeatPairingsCount < best.repeatPairingsCount) {
      best = { teams, repeatPairingsCount }
    }
    if (best.repeatPairingsCount === 0) break
  }

  // best is always set: maxAttempts is never 0 in practice, and the
  // loop runs at least once whenever it is > 0.
  return best!
}
