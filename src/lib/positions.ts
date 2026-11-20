export type Position = 'GK' | 'DEF' | 'ATT' | 'UTIL'

export const POSITIONS: readonly Position[] = ['GK', 'DEF', 'ATT', 'UTIL']

/** One outfield position, plus GK on top if they will go in goal. Outfield comes first so `positions[0]` is the main one. */
export function togglePosition(current: readonly string[], pick: Position): Position[] {
  const hasGk = current.includes('GK')
  const outfield = current.find((p) => p !== 'GK') as Position | undefined

  if (pick === 'GK') {
    const rest = outfield ? [outfield] : []
    return hasGk ? rest : [...rest, 'GK']
  }
  if (outfield === pick) return hasGk ? ['GK'] : []
  return hasGk ? [pick, 'GK'] : [pick]
}
