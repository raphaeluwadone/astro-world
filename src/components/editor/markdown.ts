import type { JSONContent } from '@tiptap/react'
import type { MentionKind, Mentionable } from '@/features/community/mentions/tokens'

// Posts, replies, tributes and articles store a small Markdown subset: **bold**, _italic_,
// [links](url), "- " and "1. " lists, plus "## ", "### ", "> " and ![images](url) in articles.
// A blank line splits paragraphs and a single newline is a line break, so older plain text reads the same.

export type Variant = 'basic' | 'article'

export type Inline =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; href?: string }
  | { type: 'br' }
  | { type: 'mention'; mention: Mentionable }

export type Block =
  | { type: 'p'; inline: Inline[] }
  | { type: 'h'; level: 2 | 3; inline: Inline[] }
  | { type: 'quote'; inline: Inline[] }
  | { type: 'ul' | 'ol'; items: Inline[][] }
  | { type: 'img'; src: string; alt: string }

const TOKEN = /@\[([^\]\n]+)\]\((player|tag|achievement|memorial|cup):([^)\n]*)\)/y
const ESCAPABLE = new Set(['\\', '*', '_', '[', ']', '-', '#', '>', '!', '.'])
const SAFE_URL = /^(https?:\/\/|mailto:|\/)[^\s)]+$/
const UL = /^[-*] (.*)$/
const OL = /^\d+\. (.*)$/
const IMG = /^!\[([^\]\n]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/

function tokenAt(s: string, i: number) {
  TOKEN.lastIndex = i
  return TOKEN.exec(s)
}

function findClose(s: string, from: number, marker: string) {
  for (let i = from; i < s.length; i++) {
    if (s[i] === '\\') {
      i++
      continue
    }
    if (s[i] === '@') {
      const t = tokenAt(s, i)
      if (t) {
        i += t[0].length - 1
        continue
      }
    }
    if (s[i] === '\n') return -1
    if (s.startsWith(marker, i)) return i
  }
  return -1
}

type Marks = { bold?: boolean; italic?: boolean; href?: string }

function inlineInto(out: Inline[], s: string, marks: Marks) {
  let buf = ''
  const flush = () => {
    if (!buf) return
    const prev = out[out.length - 1]
    if (prev?.type === 'text' && prev.bold === marks.bold && prev.italic === marks.italic && prev.href === marks.href) prev.text += buf
    else out.push({ type: 'text', text: buf, ...marks })
    buf = ''
  }
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '\\' && ESCAPABLE.has(s[i + 1])) {
      buf += s[i + 1]
      i += 2
      continue
    }
    if (c === '@') {
      const t = tokenAt(s, i)
      if (t) {
        flush()
        out.push({ type: 'mention', mention: { label: t[1], kind: t[2] as MentionKind, ref: t[3] } })
        i += t[0].length
        continue
      }
    }
    if (c === '\n') {
      flush()
      out.push({ type: 'br' })
      i++
      continue
    }
    if (c === '*' && s[i + 1] === '*' && !marks.bold) {
      const close = findClose(s, i + 2, '**')
      if (close > i + 2) {
        flush()
        inlineInto(out, s.slice(i + 2, close), { ...marks, bold: true })
        i = close + 2
        continue
      }
    }
    if (c === '_' && !marks.italic && (i === 0 || !/[\p{L}\p{N}]/u.test(s[i - 1]))) {
      const close = findClose(s, i + 1, '_')
      if (close > i + 1 && !/[\p{L}\p{N}]/u.test(s[close + 1] ?? '')) {
        flush()
        inlineInto(out, s.slice(i + 1, close), { ...marks, italic: true })
        i = close + 1
        continue
      }
    }
    if (c === '[' && !marks.href) {
      const mid = findClose(s, i + 1, '](')
      const end = mid > i ? s.indexOf(')', mid + 2) : -1
      const href = end > 0 ? s.slice(mid + 2, end) : ''
      if (end > 0 && SAFE_URL.test(href)) {
        flush()
        inlineInto(out, s.slice(i + 1, mid), { ...marks, href })
        i = end + 1
        continue
      }
    }
    buf += c
    i++
  }
  flush()
  return out
}

export function parseInline(s: string): Inline[] {
  return inlineInto([], s, {})
}

export function parseBlocks(src: string, variant: Variant = 'basic'): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  const full = variant === 'article'
  let para: string[] = []
  const endPara = () => {
    if (para.length) blocks.push({ type: 'p', inline: parseInline(para.join('\n')) })
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) {
      endPara()
      continue
    }
    const h = full ? /^(#{2,3}) (.+)$/.exec(line) : null
    if (h) {
      endPara()
      blocks.push({ type: 'h', level: h[1].length as 2 | 3, inline: parseInline(h[2]) })
      continue
    }
    const img = full ? IMG.exec(line.trim()) : null
    if (img) {
      endPara()
      blocks.push({ type: 'img', alt: img[1], src: img[2] })
      continue
    }
    if (full && /^> ?/.test(line)) {
      endPara()
      const quote: string[] = []
      while (i < lines.length && /^> ?/.test(lines[i])) quote.push(lines[i++].replace(/^> ?/, ''))
      i--
      blocks.push({ type: 'quote', inline: parseInline(quote.join('\n').replace(/\s+$/, '')) })
      continue
    }
    const list = UL.test(line) ? UL : OL.test(line) ? OL : null
    if (list) {
      endPara()
      const items: Inline[][] = []
      while (i < lines.length && list.test(lines[i])) items.push(parseInline(list.exec(lines[i++])![1]))
      i--
      blocks.push({ type: list === UL ? 'ul' : 'ol', items })
      continue
    }
    para.push(line)
  }
  endPara()
  return blocks
}

function inlineText(inline: Inline[]) {
  return inline
    .map((n) => (n.type === 'text' ? n.text : n.type === 'br' ? ' ' : `${n.mention.kind === 'tag' ? '#' : '@'}${n.mention.label}`))
    .join('')
}

/** Mentions in stored text, once each, in the shape createPost expects. */
export function mentionsIn(src: string): Mentionable[] {
  const seen = new Map<string, Mentionable>()
  const walk = (inline: Inline[]) => inline.forEach((n) => n.type === 'mention' && seen.set(`${n.mention.kind}:${n.mention.ref}:${n.mention.label}`, n.mention))
  for (const b of parseBlocks(src, 'article')) {
    if ('items' in b) b.items.forEach(walk)
    else if ('inline' in b) walk(b.inline)
  }
  return [...seen.values()]
}

/** Readable text with the formatting stripped, for previews, excerpts and search. */
export function toPlainText(src: string) {
  return parseBlocks(src, 'article')
    .map((b) => (b.type === 'img' ? '' : 'items' in b ? b.items.map(inlineText).join(', ') : inlineText(b.inline)))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------- TipTap JSON <-> Markdown ----------

function inlineToJson(inline: Inline[]): JSONContent[] {
  return inline.map((n) => {
    if (n.type === 'br') return { type: 'hardBreak' }
    if (n.type === 'mention') return { type: 'mention', attrs: { kind: n.mention.kind, ref: n.mention.ref, label: n.mention.label } }
    const marks = [
      ...(n.href ? [{ type: 'link', attrs: { href: n.href } }] : []),
      ...(n.bold ? [{ type: 'bold' }] : []),
      ...(n.italic ? [{ type: 'italic' }] : []),
    ]
    return { type: 'text', text: n.text, ...(marks.length ? { marks } : {}) }
  })
}

const para = (inline: Inline[]): JSONContent => ({ type: 'paragraph', content: inlineToJson(inline) })

export function markdownToDoc(src: string, variant: Variant): JSONContent {
  const content = parseBlocks(src, variant).map((b): JSONContent => {
    switch (b.type) {
      case 'p':
        return para(b.inline)
      case 'h':
        return { type: 'heading', attrs: { level: b.level }, content: inlineToJson(b.inline) }
      case 'quote':
        return { type: 'blockquote', content: [para(b.inline)] }
      case 'img':
        return { type: 'image', attrs: { src: b.src, alt: b.alt } }
      default:
        return { type: b.type === 'ul' ? 'bulletList' : 'orderedList', content: b.items.map((it) => ({ type: 'listItem', content: [para(it)] })) }
    }
  })
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

// An underscore inside a word can't open italics, so it stays bare.
const escapeText = (t: string) => t.replace(/[\\*[\]]|(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, '\\$&')

function escapeLineStart(line: string) {
  return line.replace(/^(\s*)([-#>!]|\d+\.)/, (_, sp: string, m: string) => (/\d/.test(m) ? `${sp}${m.slice(0, -1)}\\.` : `${sp}\\${m}`))
}

type MarkKey = 'link' | 'bold' | 'italic'
const OPEN: Record<MarkKey, string> = { link: '[', bold: '**', italic: '_' }

function serializeInline(nodes: JSONContent[] = [], breakAs = '\n') {
  let out = ''
  let stack: { key: MarkKey; href?: string }[] = []
  const close = (n: number) => {
    while (stack.length > n) {
      const m = stack.pop()!
      out += m.key === 'link' ? `](${m.href})` : OPEN[m.key]
    }
  }
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      close(0)
      out += breakAs
      continue
    }
    if (node.type === 'mention') {
      close(0)
      const { kind, ref, label } = node.attrs ?? {}
      out += `@[${String(label).replace(/[[\]]/g, '')}](${kind}:${String(ref ?? '').replace(/[()]/g, '')})`
      continue
    }
    if (node.type !== 'text' || !node.text) continue
    const marks = node.marks ?? []
    const want: { key: MarkKey; href?: string }[] = []
    const link = marks.find((m) => m.type === 'link')
    if (link && SAFE_URL.test(String(link.attrs?.href ?? ''))) want.push({ key: 'link', href: String(link.attrs!.href) })
    if (marks.some((m) => m.type === 'bold')) want.push({ key: 'bold' })
    if (marks.some((m) => m.type === 'italic')) want.push({ key: 'italic' })
    let k = 0
    while (k < stack.length && k < want.length && stack[k].key === want[k].key && stack[k].href === want[k].href) k++
    close(k)
    for (const m of want.slice(k)) out += OPEN[m.key]
    stack = want
    out += escapeText(node.text)
  }
  close(0)
  return out
}

const lineSafe = (s: string) => s.split('\n').map(escapeLineStart).join('\n')

function blockToMarkdown(b: JSONContent): string[] {
  switch (b.type) {
    case 'heading': {
      const text = serializeInline(b.content, ' ').trim()
      return text ? [`${'#'.repeat(b.attrs?.level === 3 ? 3 : 2)} ${text}`] : []
    }
    case 'blockquote': {
      // Paragraphs become "> " lines; anything else in the quote (an image, a list) is kept as its own block.
      const out: string[] = []
      let lines: string[] = []
      const endQuote = () => {
        const text = lines.join('\n').trim()
        if (text) out.push(text.split('\n').map((l) => `> ${l}`.trimEnd()).join('\n'))
        lines = []
      }
      for (const c of b.content ?? []) {
        if (c.type === 'paragraph') lines.push(serializeInline(c.content))
        else {
          endQuote()
          out.push(...blockToMarkdown(c))
        }
      }
      endQuote()
      return out
    }
    case 'image':
      return b.attrs?.src ? [`![${String(b.attrs.alt ?? '').replace(/[[\]]/g, '')}](${b.attrs.src})`] : []
    case 'bulletList':
    case 'orderedList':
      return [
        (b.content ?? [])
          .flatMap(function items(li: JSONContent): string[] {
            const own = (li.content ?? []).filter((c) => c.type === 'paragraph').map((p) => serializeInline(p.content, ' ')).join(' ')
            const nested = (li.content ?? []).filter((c) => c.type?.endsWith('List')).flatMap((l) => (l.content ?? []).flatMap(items))
            return [own, ...nested]
          })
          .map((t, i) => (b.type === 'bulletList' ? `- ${t}` : `${i + 1}. ${t}`))
          .join('\n'),
      ]
    default:
      return [lineSafe(serializeInline(b.content))]
  }
}

export function docToMarkdown(doc: JSONContent): string {
  return (doc.content ?? [])
    .flatMap(blockToMarkdown)
    .map((s) => s.replace(/[ \t]+$/gm, ''))
    .filter((s) => s.trim())
    .join('\n\n')
    .trim()
}
