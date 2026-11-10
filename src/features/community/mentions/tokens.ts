export type MentionKind = 'player' | 'tag' | 'achievement' | 'memorial' | 'cup'

export interface Mentionable {
  kind: MentionKind
  /** Player or tag id; the achievement name; empty for the memorial and the cup. */
  ref: string
  label: string
  sub?: string
}

export type ContentPart = { type: 'text'; text: string } | { type: 'mention'; mention: Mentionable }

// Stored in posts.content as @[Label](kind:ref), so plain text stays readable anywhere it leaks.
const TOKEN = /@\[([^\]\n]+)\]\((player|tag|achievement|memorial|cup):([^)\n]*)\)/g

export function toToken(m: Mentionable) {
  return `@[${m.label.replace(/[[\]]/g, '')}](${m.kind}:${m.ref.replace(/[()]/g, '')})`
}

export function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  let last = 0
  for (const match of content.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ type: 'text', text: content.slice(last, match.index) })
    parts.push({ type: 'mention', mention: { label: match[1], kind: match[2] as MentionKind, ref: match[3] } })
    last = match.index + match[0].length
  }
  if (last < content.length) parts.push({ type: 'text', text: content.slice(last) })
  return parts
}

export function plainText(content: string) {
  return content.replace(TOKEN, '@$1')
}

/** Splits typed text into plain runs and picked "@Label"s; longest label wins, so "@Salami Cup" beats "@Salami". */
export function splitTyped(text: string, picked: Mentionable[]): ContentPart[] {
  const remaining = [...picked].sort((a, b) => b.label.length - a.label.length)
  const parts: ContentPart[] = []
  let plain = ''
  let i = 0
  while (i < text.length) {
    const hit = text[i] === '@' ? remaining.findIndex((m) => text.startsWith(`@${m.label}`, i)) : -1
    if (hit === -1) {
      plain += text[i++]
      continue
    }
    const [m] = remaining.splice(hit, 1)
    if (plain) parts.push({ type: 'text', text: plain })
    plain = ''
    parts.push({ type: 'mention', mention: m })
    i += m.label.length + 1
  }
  if (plain) parts.push({ type: 'text', text: plain })
  return parts
}

export function encodeMentions(text: string, picked: Mentionable[]) {
  const parts = splitTyped(text, picked)
  return {
    content: parts.map((p) => (p.type === 'text' ? p.text : toToken(p.mention))).join(''),
    mentions: parts.flatMap((p) => (p.type === 'mention' ? [p.mention] : [])),
  }
}

export const SALAMI: Mentionable = { kind: 'memorial', ref: '', label: 'Salami', sub: 'In memory · #13' }
export const SALAMI_CUP: Mentionable = { kind: 'cup', ref: '', label: 'Salami Cup', sub: 'Quarterly tournament' }
