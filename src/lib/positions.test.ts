import { describe, expect, it } from 'vitest'
import { togglePosition } from './positions'

describe('togglePosition', () => {
  it('picks a single outfield position', () => {
    expect(togglePosition([], 'ATT')).toEqual(['ATT'])
  })

  it('swaps the outfield position instead of adding a second', () => {
    expect(togglePosition(['ATT'], 'DEF')).toEqual(['DEF'])
    expect(togglePosition(['DEF'], 'UTIL')).toEqual(['UTIL'])
  })

  it('clears the outfield position when it is picked again', () => {
    expect(togglePosition(['ATT'], 'ATT')).toEqual([])
  })

  it('adds and removes GK on top of an outfield position', () => {
    expect(togglePosition(['DEF'], 'GK')).toEqual(['DEF', 'GK'])
    expect(togglePosition(['DEF', 'GK'], 'GK')).toEqual(['DEF'])
  })

  it('lets GK be the only position', () => {
    expect(togglePosition([], 'GK')).toEqual(['GK'])
    expect(togglePosition(['GK'], 'GK')).toEqual([])
  })

  it('keeps GK when the outfield position changes or clears', () => {
    expect(togglePosition(['ATT', 'GK'], 'DEF')).toEqual(['DEF', 'GK'])
    expect(togglePosition(['ATT', 'GK'], 'ATT')).toEqual(['GK'])
    expect(togglePosition(['GK'], 'UTIL')).toEqual(['UTIL', 'GK'])
  })

  it('tidies up a record that already holds several outfield positions', () => {
    expect(togglePosition(['GK', 'DEF', 'UTIL'], 'GK')).toEqual(['DEF'])
    expect(togglePosition(['GK', 'DEF', 'UTIL'], 'ATT')).toEqual(['ATT', 'GK'])
  })
})
