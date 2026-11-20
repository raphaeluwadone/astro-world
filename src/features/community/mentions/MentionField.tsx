import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from 'cn'
import { useMentionables } from '../hooks'
import { KindGlyph, mentionText, tierSwatch } from './MentionChip'
import { SALAMI, SALAMI_CUP, sigil, splitTyped, type MentionKind, type Mentionable } from './tokens'

export const GROUPS: { kind: MentionKind; title: string; max: number }[] = [
  { kind: 'memorial', title: 'In memory', max: 1 },
  { kind: 'cup', title: 'Competitions', max: 1 },
  { kind: 'player', title: 'Players', max: 6 },
  { kind: 'tag', title: 'Traits', max: 4 },
  { kind: 'achievement', title: 'Badges', max: 4 },
]

const FIXED_TERMS: Partial<Record<MentionKind, string[]>> = {
  memorial: ['salami', 'ade', '13'],
  cup: ['salami cup', 'cup', 'tournament'],
}

function score(m: Mentionable, q: string) {
  if (!q) return 0
  const label = m.label.toLowerCase()
  const terms = FIXED_TERMS[m.kind] ?? [label, ...(m.sub ? [m.sub.toLowerCase()] : [])]
  if (terms.some((t) => t.startsWith(q))) return 0
  if (terms.some((t) => t.split(/\s+/).some((w) => w.startsWith(q)))) return 1
  if (terms.some((t) => t.includes(q))) return 2
  return -1
}

export function filter(all: Mentionable[], q: string) {
  const query = q.toLowerCase()
  return GROUPS.flatMap((g) =>
    all
      .filter((m) => m.kind === g.kind)
      .map((m) => ({ m, s: score(m, query) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s || a.m.label.localeCompare(b.m.label))
      .slice(0, g.max)
      .map((x) => x.m),
  )
}

/** The "@query" the caret is sitting in, if any. */
function activeQuery(value: string, caret: number) {
  const match = /(?:^|\s)@([^\s@]{0,30})$/.exec(value.slice(0, caret))
  return match ? { start: caret - match[1].length - 1, q: match[1] } : null
}

/** Mentions still present in the text, in the shape createPost and friends expect. */
export function taggedIn(value: string, picked: Mentionable[]) {
  return splitTyped(value, picked).flatMap((p) => (p.type === 'mention' ? [p.mention] : []))
}

type FieldEl = HTMLInputElement | HTMLTextAreaElement

/**
 * Text field with @ tagging: a picker while typing @, and tagged names coloured in place.
 * The coloured text is a mirror behind a field whose own text is transparent.
 */
export function MentionField({
  value,
  onChange,
  picked,
  onPickedChange,
  multiline = false,
  rows = 5,
  placeholder,
  disabled,
  onEnter,
  className,
  pickerClassName,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  picked: Mentionable[]
  onPickedChange: (picked: Mentionable[]) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  disabled?: boolean
  /** Single-line only: Enter with the picker closed. */
  onEnter?: () => void
  /** Padding and text size, applied to both the field and the mirror so they line up. */
  className?: string
  pickerClassName?: string
  'aria-label'?: string
}) {
  const fieldRef = useRef<FieldEl>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const [query, setQuery] = useState<{ start: number; q: string } | null>(null)
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const { data: mentionables = [] } = useMentionables()
  const listId = useRef(`mention-list-${Math.random().toString(36).slice(2, 8)}`).current

  const all = useMemo(() => [SALAMI, SALAMI_CUP, ...mentionables], [mentionables])
  const results = useMemo(() => (query ? filter(all, query.q) : []), [all, query])
  const open = !!query && query.start !== dismissedAt && results.length > 0
  const typedParts = useMemo(() => splitTyped(value, picked), [value, picked])

  useLayoutEffect(() => {
    const pos = pendingCaret.current
    if (pos == null || !fieldRef.current) return
    pendingCaret.current = null
    fieldRef.current.focus()
    fieldRef.current.setSelectionRange(pos, pos)
    syncScroll()
  }, [value])

  function syncScroll() {
    const f = fieldRef.current
    const m = mirrorRef.current
    if (!f || !m) return
    m.scrollLeft = f.scrollLeft
    m.scrollTop = f.scrollTop
  }

  function syncQuery(next: string, caret: number | null) {
    const q = caret == null ? null : activeQuery(next, caret)
    setQuery(q)
    if (q?.start !== query?.start || q?.q !== query?.q) setActive(0)
  }

  function choose(m: Mentionable) {
    if (!query) return
    const end = query.start + 1 + query.q.length
    const insert = `${sigil(m.kind)}${m.label} `
    onChange(value.slice(0, query.start) + insert + value.slice(end))
    onPickedChange([...picked, m])
    setQuery(null)
    pendingCaret.current = query.start + insert.length
  }

  function onKeyDown(e: KeyboardEvent<FieldEl>) {
    if (open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const step = e.key === 'ArrowDown' ? 1 : -1
        setActive((i) => (i + step + results.length) % results.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        choose(results[active])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setDismissedAt(query!.start)
        return
      }
    }
    if (e.key === 'Enter' && !multiline && onEnter) onEnter()
  }

  const fieldProps = {
    value,
    onChange: (e: React.ChangeEvent<FieldEl>) => {
      onChange(e.target.value)
      syncQuery(e.target.value, e.target.selectionStart)
    },
    onSelect: (e: React.SyntheticEvent<FieldEl>) => {
      syncQuery(e.currentTarget.value, e.currentTarget.selectionStart)
      syncScroll()
    },
    onBlur: () => setTimeout(() => setQuery(null), 120),
    onKeyDown,
    onScroll: syncScroll,
    onKeyUp: syncScroll,
    disabled,
    placeholder,
    role: 'combobox' as const,
    'aria-label': ariaLabel,
    'aria-expanded': open,
    'aria-controls': listId,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant': open ? `${listId}-${active}` : undefined,
    className: cn(
      'relative block w-full bg-transparent text-transparent caret-astro-text placeholder:text-astro-text-dim focus:outline-none selection:bg-astro-accent/30 selection:text-transparent',
      multiline && 'resize-none',
      className,
    ),
  }

  let lastKind: MentionKind | null = null

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden text-astro-text',
          multiline ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
          className,
        )}
      >
        {typedParts.map((part, i) =>
          part.type === 'text' ? (
            <span key={i}>{part.text}</span>
          ) : (
            <span key={i} className={cn('font-bold', mentionText(part.mention))}>
              {sigil(part.mention.kind)}{part.mention.label}
            </span>
          ),
        )}
        {/* Keeps a trailing newline's line height in the mirror. */}
        {multiline && '​'}
      </div>
      {multiline ? (
        <textarea ref={fieldRef as React.RefObject<HTMLTextAreaElement>} rows={rows} {...fieldProps} />
      ) : (
        <input ref={fieldRef as React.RefObject<HTMLInputElement>} {...fieldProps} />
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          className={cn(
            'absolute left-0 top-full z-30 mt-2 max-h-[340px] w-full overflow-y-auto rounded-xl border border-white/[0.1] bg-astro-surface-2 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] sm:w-[340px]',
            pickerClassName,
          )}
        >
          {results.map((m, i) => {
            const header = m.kind !== lastKind ? GROUPS.find((g) => g.kind === m.kind)!.title : null
            lastKind = m.kind
            const memorial = m.kind === 'memorial'
            return (
              <div key={`${m.kind}-${m.ref}`}>
                {header && (
                  <div className="px-2.5 pb-1 pt-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">
                    {header}
                  </div>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(m)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2',
                    i === active && (memorial ? 'bg-[#cbd5f5]/[0.1]' : 'bg-white/[0.06]'),
                    memorial && 'border border-[#cbd5f5]/20 bg-[linear-gradient(120deg,rgba(203,213,245,0.08),transparent)]',
                    m.kind === 'cup' && 'border border-astro-amber/30 bg-[linear-gradient(120deg,rgba(242,169,59,0.14),transparent)]',
                    m.kind === 'cup' && i === active && 'bg-astro-amber/[0.12]',
                  )}
                >
                  <span
                    style={m.kind === 'achievement' ? tierSwatch(m.label) : undefined}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-extrabold',
                      m.kind === 'player' && 'bg-astro-accent/15 text-astro-accent-soft',
                      m.kind === 'tag' && 'bg-white/[0.06] text-[#c3cbe6]',
                      m.kind === 'cup' && 'border border-astro-amber/50 bg-astro-amber/15',
                    )}
                  >
                    <KindGlyph kind={m.kind} className={memorial ? 'size-6 text-[13px]' : undefined} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[13px] font-bold text-astro-text',
                        memorial && 'font-display text-[17px] font-normal tracking-[0.02em] text-[#e8ecfa]',
                        m.kind === 'cup' && 'font-display text-[17px] font-normal tracking-[0.02em] text-[#f7c25e]',
                      )}
                    >
                      {m.label}
                    </span>
                    {m.sub && <span className="block truncate text-[11px] text-astro-text-dim">{m.sub}</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
