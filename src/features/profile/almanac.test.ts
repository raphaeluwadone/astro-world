import { describe, expect, it } from 'vitest'
import { inlineParts, monthSeries } from './almanac'

describe('inlineParts', () => {
  it('splits bold and italic markers', () => {
    expect(inlineParts('**Bass** keeps _34 of them_ clean.')).toEqual([
      { text: 'Bass', style: 'bold' },
      { text: ' keeps ', style: 'plain' },
      { text: '34 of them', style: 'italic' },
      { text: ' clean.', style: 'plain' },
    ])
  })
  it('leaves plain text and stray underscores alone', () => {
    expect(inlineParts('no markers here')).toEqual([{ text: 'no markers here', style: 'plain' }])
  })
})

describe('monthSeries', () => {
  it('fills missing months with zeros', () => {
    const s = monthSeries({ '1': { g: 3, a: 2 }, '4': { g: 1, a: 0, dotm: 78 } })
    expect(s).toHaveLength(11)
    expect(s[0]).toMatchObject({ label: 'Jan', g: 3, a: 2 })
    expect(s[1]).toMatchObject({ g: 0, a: 0 })
    expect(s[3].dotm).toBe(78)
  })
})
