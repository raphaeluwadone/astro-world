export interface RotationGame {
  team_a_id: string
  team_b_id: string
  ended_at: string | null
  goals: { team_id: string }[]
}

export type GameResult = { winner: string; loser: string } | { draw: [string, string] }

export function score(game: RotationGame, teamId: string) {
  return game.goals.filter((g) => g.team_id === teamId).length
}

/** First to the target ends it early; otherwise whoever leads at full time. Level means a draw. */
export function resultOf(game: RotationGame): GameResult {
  const a = score(game, game.team_a_id)
  const b = score(game, game.team_b_id)
  if (a === b) return { draw: [game.team_a_id, game.team_b_id] }
  return a > b ? { winner: game.team_a_id, loser: game.team_b_id } : { winner: game.team_b_id, loser: game.team_a_id }
}

export interface RotationState {
  /** The team that stays on, or null after a draw (or before the first game). */
  on: string | null
  /** Waiting teams, next up first. */
  queue: string[]
  next: [string, string] | null
}

/**
 * Replays the finished games over the opening order. Winners stay on and losers go to the back.
 * After a draw both go to the back, earlier Greek letter (`greekOrder`) first. A game played off-rotation is still
 * honoured: its teams are pulled from wherever they were, and a benched stayer goes to the front.
 */
export function rotation(order: string[], finished: RotationGame[], greekOrder: string[] = order): RotationState {
  const rank = (id: string) => greekOrder.indexOf(id)
  let on: string | null = null
  let queue = [...order]

  for (const g of finished) {
    const playing = [g.team_a_id, g.team_b_id]
    queue = queue.filter((id) => !playing.includes(id))
    if (on && !playing.includes(on)) queue.unshift(on)
    const r = resultOf(g)
    if ('winner' in r) {
      on = r.winner
      queue.push(r.loser)
    } else {
      on = null
      queue.push(...[...r.draw].sort((x, y) => rank(x) - rank(y)))
    }
  }

  const next: [string, string] | null = on ? (queue[0] ? [on, queue[0]] : null) : queue.length >= 2 ? [queue[0], queue[1]] : null
  return { on, queue: next && on ? queue.slice(1) : next ? queue.slice(2) : queue, next }
}

export interface TableRow {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

/** 3 for a win, 1 for a draw. Ties broken on goal difference, then goals scored, then opening order. */
export function dayTable(order: string[], finished: RotationGame[]): TableRow[] {
  const rows = new Map(order.map((teamId) => [teamId, { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }]))
  for (const g of finished) {
    const r = resultOf(g)
    for (const [me, them] of [
      [g.team_a_id, g.team_b_id],
      [g.team_b_id, g.team_a_id],
    ]) {
      const row = rows.get(me)
      if (!row) continue
      row.played++
      row.goalsFor += score(g, me)
      row.goalsAgainst += score(g, them)
      if ('draw' in r) {
        row.drawn++
        row.points += 1
      } else if (r.winner === me) {
        row.won++
        row.points += 3
      } else row.lost++
    }
  }
  return [...rows.values()].sort(
    (x, y) => y.points - x.points || y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) || y.goalsFor - x.goalsFor || order.indexOf(x.teamId) - order.indexOf(y.teamId),
  )
}

/** Fisher-Yates; the opening order is only shuffled when an admin asks. */
export function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
