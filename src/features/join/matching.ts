import type { UnclaimedPlayer } from './api'

export interface ScoredMatch {
  player: UnclaimedPlayer
  score: number
  why: string[]
}

/** first_name/surname aren't separate columns; a roster's full_name is
 * always "First Last[ More]", so the first token is the first name and
 * everything after it is the surname, same split the Join design's own
 * fake records use. */
function splitName(fullName: string): { first: string; surname: string } {
  const parts = fullName.trim().split(/\s+/)
  return { first: parts[0] ?? '', surname: parts.slice(1).join(' ') }
}

/** Ported verbatim from the design's own scoring rules (Astro Join.dc.html). */
function scoreOne(player: UnclaimedPlayer, nickInput: string, surnameInput: string): ScoredMatch {
  const n = nickInput.trim().toLowerCase()
  const s = surnameInput.trim().toLowerCase()
  const { first, surname } = splitName(player.full_name)
  let score = 0
  const why: string[] = []

  if (n) {
    const rn = player.nickname.toLowerCase()
    if (rn === n) {
      score += 5
      why.push('same nickname')
    } else if (rn.indexOf(n) === 0 || n.indexOf(rn) === 0) {
      score += 3
      why.push('nickname starts the same')
    } else if (rn.indexOf(n) > -1) {
      score += 2
      why.push('nickname contains that')
    }
    if (first.toLowerCase() === n) {
      score += 2
      why.push("that's their first name")
    }
  }

  if (s) {
    const rs = surname.toLowerCase()
    if (rs === s) {
      score += 4
      why.push('same surname')
    } else if (rs.indexOf(s) === 0) {
      score += 2
      why.push('surname starts the same')
    }
  }

  return { player, score, why }
}

/** Top 4 candidates, best first, scored 0 excluded. */
export function findMatches(
  players: UnclaimedPlayer[],
  nickInput: string,
  surnameInput: string,
): ScoredMatch[] {
  return players
    .map((p) => scoreOne(p, nickInput, surnameInput))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}
