import { describe, expect, it } from 'vitest'
import { docToMarkdown, markdownToDoc, parseBlocks } from './markdown'

const roundTrip = (md: string) => docToMarkdown(markdownToDoc(md, 'article'))

describe('article image layout', () => {
  it('defaults older images to full width', () => {
    expect(parseBlocks('![](https://x.test/a.jpg)', 'article')).toEqual([{ type: 'img', alt: '', src: 'https://x.test/a.jpg', size: 'full', align: 'center' }])
    expect(roundTrip('![](https://x.test/a.jpg)')).toBe('![](https://x.test/a.jpg)')
  })

  it('keeps size and alignment through the editor', () => {
    expect(roundTrip('![](https://x.test/a.jpg "small left")')).toBe('![](https://x.test/a.jpg "small left")')
    expect(roundTrip('![](https://x.test/a.jpg "medium")')).toBe('![](https://x.test/a.jpg "medium")')
  })

  it('drops alignment on full-width images and ignores unknown words', () => {
    expect(roundTrip('![](https://x.test/a.jpg "full right")')).toBe('![](https://x.test/a.jpg)')
    expect(parseBlocks('![](https://x.test/a.jpg "huge sideways")', 'article')[0]).toMatchObject({ size: 'full', align: 'center' })
  })
})
