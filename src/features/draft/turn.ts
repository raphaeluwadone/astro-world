import { TEAM_ID } from '@/lib/teamId'

export interface DraftSession {
  id: string
  matchday_id: string
  team_count: number
  pool: string[]
  status: 'live' | 'complete'
}
export interface DraftCaptain {
  slot: number
  player_id: string
}
export interface DraftPick {
  pick_no: number
  slot: number
  player_id: string
  picked_by: string | null
}
export interface DraftState {
  session: DraftSession | null
  captains: DraftCaptain[]
  picks: DraftPick[]
}

export const EMPTY_DRAFT: DraftState = { session: null, captains: [], picks: [] }

/** Pick 1 is team 1. After team N the order turns round, N back to 1, then runs 1 to N again. */
export function slotForPick(pick: number, teams: number) {
  const round = Math.floor((pick - 1) / teams)
  const i = (pick - 1) % teams
  return round % 2 === 0 ? i + 1 : teams - i
}

/** Round and direction for a pick, e.g. "Round 2: Zeta back to Alpha". */
export function roundNote(pick: number, teams: number) {
  const round = Math.floor((pick - 1) / teams) + 1
  const first = TEAM_ID[0].name
  const last = TEAM_ID[teams - 1].name
  return round % 2 === 1 ? `Round ${round}: ${first} to ${last}` : `Round ${round}: ${last} back to ${first}`
}

export function poolLeft(state: DraftState) {
  if (!state.session) return []
  const taken = new Set([...state.captains.map((c) => c.player_id), ...state.picks.map((p) => p.player_id)])
  return state.session.pool.filter((id) => !taken.has(id))
}

/** Everyone who is not a captain gets picked once. */
export function totalPicks(state: DraftState) {
  return state.session ? state.session.pool.length - state.session.team_count : 0
}

export interface Clock {
  pickNo: number
  slot: number
  captainId: string
}

export function onTheClock(state: DraftState): Clock | null {
  if (!state.session || state.session.status !== 'live') return null
  const pickNo = state.picks.length + 1
  const slot = slotForPick(pickNo, state.session.team_count)
  const captain = state.captains.find((c) => c.slot === slot)
  return captain ? { pickNo, slot, captainId: captain.player_id } : null
}

export interface Side {
  slot: number
  name: string
  colour: string
  captainId: string
  picks: DraftPick[]
}

export function sides(state: DraftState): Side[] {
  const session = state.session
  if (!session) return []
  return Array.from({ length: session.team_count }, (_, i) => ({
    slot: i + 1,
    name: TEAM_ID[i].name,
    colour: TEAM_ID[i].colour,
    captainId: state.captains.find((c) => c.slot === i + 1)?.player_id ?? '',
    picks: state.picks.filter((p) => p.slot === i + 1),
  }))
}

/** Captain first, then picks in the order they were made: what the publish step writes. */
export function teamsFromDraft(state: DraftState): string[][] {
  return sides(state).map((s) => [s.captainId, ...s.picks.map((p) => p.player_id)])
}
