import { describe, expect, it } from 'vitest'
import { onTheClock, poolLeft, roundNote, shuffled, slotForPick, teamsFromDraft, totalPicks, type DraftState } from './turn'

const seq = (teams: number, count: number) => Array.from({ length: count }, (_, i) => slotForPick(i + 1, teams))

const state = (over: Partial<DraftState['session']> = {}, picks: DraftState['picks'] = []): DraftState => ({
  session: { id: 's', matchday_id: 'm', team_count: 3, pool: ['c1', 'c2', 'c3', 'a', 'b', 'c', 'd'], status: 'live', ...over },
  captains: [
    { slot: 1, player_id: 'c1' },
    { slot: 2, player_id: 'c2' },
    { slot: 3, player_id: 'c3' },
  ],
  picks,
})

describe('slotForPick', () => {
  it('runs 1 to 6, then 6 back to 1, then 1 to 6 again', () => {
    expect(seq(6, 18)).toEqual([1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6])
  })
  it('works for three sides', () => {
    expect(seq(3, 9)).toEqual([1, 2, 3, 3, 2, 1, 1, 2, 3])
  })
})

describe('draft state', () => {
  it('puts the first pick with team 1 and moves on after each pick', () => {
    expect(onTheClock(state())).toEqual({ pickNo: 1, slot: 1, captainId: 'c1' })
    expect(onTheClock(state({}, [{ pick_no: 1, slot: 1, player_id: 'a', picked_by: 'c1' }]))).toEqual({ pickNo: 2, slot: 2, captainId: 'c2' })
  })
  it('gives the last team two picks in a row where the order turns', () => {
    const picks = [
      { pick_no: 1, slot: 1, player_id: 'a', picked_by: null },
      { pick_no: 2, slot: 2, player_id: 'b', picked_by: null },
      { pick_no: 3, slot: 3, player_id: 'c', picked_by: null },
    ]
    expect(onTheClock(state({}, picks))?.slot).toBe(3)
  })
  it('has nobody on the clock once it is complete', () => {
    expect(onTheClock(state({ status: 'complete' }))).toBeNull()
  })
  it('leaves out captains and anyone already picked', () => {
    expect(poolLeft(state({}, [{ pick_no: 1, slot: 1, player_id: 'a', picked_by: null }]))).toEqual(['b', 'c', 'd'])
    expect(totalPicks(state())).toBe(4)
  })
  it('builds each team captain first, then picks in order', () => {
    const picks = [
      { pick_no: 1, slot: 1, player_id: 'a', picked_by: null },
      { pick_no: 2, slot: 2, player_id: 'b', picked_by: null },
      { pick_no: 3, slot: 3, player_id: 'c', picked_by: null },
      { pick_no: 4, slot: 3, player_id: 'd', picked_by: null },
    ]
    expect(teamsFromDraft(state({}, picks))).toEqual([['c1', 'a'], ['c2', 'b'], ['c3', 'c', 'd']])
  })
  it('says which way the order is running', () => {
    expect(roundNote(1, 6)).toBe('Round 1: Alpha to Zeta')
    expect(roundNote(7, 6)).toBe('Round 2: Zeta back to Alpha')
    expect(roundNote(13, 6)).toBe('Round 3: Alpha to Zeta')
  })
})

describe('shuffled', () => {
  it('keeps everyone and leaves the input alone', () => {
    const input = ['a', 'b', 'c', 'd']
    const out = shuffled(input)
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })
  it('puts each person first about equally often', () => {
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 }
    for (let n = 0; n < 6000; n++) counts[shuffled(['a', 'b', 'c'])[0]]++
    for (const k of Object.keys(counts)) expect(counts[k]).toBeGreaterThan(1700)
  })
})
