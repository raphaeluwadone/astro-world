import { Extension } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { SuggestionProps } from '@tiptap/suggestion'
import { cn } from 'cn'
import { AtSign, Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMentionables } from '@/features/community/hooks'
import { KindGlyph, mentionText, tierSwatch } from '@/features/community/mentions/MentionChip'
import { filter, GROUPS } from '@/features/community/mentions/MentionField'
import { SALAMI, SALAMI_CUP, sigil, type MentionKind, type Mentionable } from '@/features/community/mentions/tokens'
import { docToMarkdown, markdownToDoc, type Variant } from './markdown'

const AstroMention = Mention.extend({
  addAttributes() {
    return { kind: { default: 'player' }, ref: { default: '' }, label: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'span[data-mention-kind]', getAttrs: (el) => ({ kind: el.dataset.mentionKind, ref: el.dataset.mentionRef, label: el.dataset.mentionLabel }) }]
  },
  renderHTML({ node }) {
    const { kind, ref, label } = node.attrs as Mentionable
    return [
      'span',
      { 'data-mention-kind': kind, 'data-mention-ref': ref, 'data-mention-label': label, class: cn('font-bold', mentionText({ kind, label })) },
      `${sigil(kind)}${label}`,
    ]
  },
  renderText({ node }) {
    return `${sigil(node.attrs.kind)}${node.attrs.label}`
  },
})

type Menu = { items: Mentionable[]; command: (m: Mentionable) => void; rect: DOMRect | null; origin: DOMRect | null }

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded-md text-astro-text-dim transition-colors hover:bg-white/[0.06] hover:text-astro-text',
        active && 'bg-astro-accent/20 text-astro-text',
      )}
    >
      {children}
    </button>
  )
}

function normalizeUrl(raw: string) {
  const t = raw.trim()
  if (!t) return ''
  if (/^(https?:\/\/|mailto:|\/)/i.test(t)) return t
  return `https://${t}`
}

function Toolbar({ editor, variant, onImage }: { editor: Editor; variant: Variant; onImage?: () => void }) {
  const [linking, setLinking] = useState<string | null>(null)
  const c = () => editor.chain().focus()

  const applyLink = () => {
    const href = normalizeUrl(linking ?? '')
    setLinking(null)
    if (!href) return void c().extendMarkRange('link').unsetLink().run()
    if (editor.state.selection.empty && !editor.isActive('link')) c().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    else c().extendMarkRange('link').setLink({ href }).run()
  }

  if (linking !== null)
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          applyLink()
        }}
      >
        <input
          autoFocus
          value={linking}
          onChange={(e) => setLinking(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            e.stopPropagation()
            setLinking(null)
            editor.commands.focus()
          }}
          placeholder="Paste a link"
          aria-label="Link address"
          className="min-h-7 min-w-0 flex-1 rounded-md border border-white/[0.12] bg-astro-bg/70 px-2 text-xs text-astro-text placeholder:text-astro-text-dim focus:border-astro-accent/60 focus:outline-none"
        />
        <button type="submit" className="rounded-md bg-astro-accent/20 px-2 py-1 text-[11px] font-extrabold text-astro-text">
          {linking.trim() ? 'Add' : 'Remove'}
        </button>
      </form>
    )

  return (
    <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatting">
      <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}>
        <Bold size={14} strokeWidth={2.6} />
      </ToolButton>
      <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}>
        <Italic size={14} strokeWidth={2.4} />
      </ToolButton>
      {variant === 'article' && (
        <>
          <ToolButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={15} />
          </ToolButton>
          <ToolButton label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={15} />
          </ToolButton>
          <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}>
            <Quote size={14} />
          </ToolButton>
        </>
      )}
      <ToolButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>
        <List size={15} />
      </ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </ToolButton>
      <ToolButton label="Link" active={editor.isActive('link')} onClick={() => setLinking(editor.getAttributes('link').href ?? '')}>
        <Link2 size={15} />
      </ToolButton>
      {onImage && (
        <ToolButton label="Image" onClick={onImage}>
          <ImagePlus size={15} />
        </ToolButton>
      )}
      <ToolButton label="Tag someone" onClick={() => c().insertContent(editor.state.selection.$from.nodeBefore?.text?.endsWith(' ') === false ? ' @' : '@').run()}>
        <AtSign size={14} />
      </ToolButton>
    </div>
  )
}

function Picker({ menu, active, setActive }: { menu: Menu; active: number; setActive: (i: number) => void }) {
  const { origin } = menu
  let lastKind: MentionKind | null = null
  const top = menu.rect && origin ? menu.rect.bottom - origin.top + 6 : 0
  const left = menu.rect && origin ? Math.max(0, Math.min(menu.rect.left - origin.left, origin.width - 300)) : 0
  return (
    <div
      role="listbox"
      style={{ top, left }}
      className="absolute z-40 max-h-[300px] w-[300px] max-w-full overflow-y-auto rounded-xl border border-white/[0.1] bg-astro-surface-2 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    >
      {menu.items.map((m, i) => {
        const header = m.kind !== lastKind ? GROUPS.find((g) => g.kind === m.kind)!.title : null
        lastKind = m.kind
        return (
          <div key={`${m.kind}-${m.ref}-${m.label}`}>
            {header && <div className="px-2.5 pb-1 pt-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">{header}</div>}
            <div
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                menu.command(m)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5', i === active && 'bg-white/[0.06]')}
            >
              <span
                style={m.kind === 'achievement' ? tierSwatch(m.label) : undefined}
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-[7px] text-[11px] font-extrabold',
                  m.kind === 'player' && 'bg-astro-accent/15 text-astro-accent-soft',
                  m.kind === 'tag' && 'bg-white/[0.06] text-[#c3cbe6]',
                  m.kind === 'cup' && 'border border-astro-amber/50 bg-astro-amber/15',
                )}
              >
                <KindGlyph kind={m.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-astro-text">{m.label}</span>
                {m.sub && <span className="block truncate text-[11px] text-astro-text-dim">{m.sub}</span>}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Formatting editor that reads and writes the Markdown subset in ./markdown.
 * "basic" is for posts, replies and tributes; "article" adds headings, quotes and images.
 */
export function RichEditor({
  value,
  onChange,
  variant = 'basic',
  placeholder,
  disabled,
  autoFocus,
  enterSubmits,
  onSubmit,
  onEscape,
  onImageUpload,
  toolbar = 'always',
  className,
  contentClassName,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (markdown: string) => void
  variant?: Variant
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  /** Plain Enter submits (Shift+Enter breaks the line). Mod+Enter always submits. */
  enterSubmits?: boolean
  onSubmit?: () => void
  onEscape?: () => void
  onImageUpload?: (file: File) => Promise<string>
  /** "focus" keeps the toolbar hidden until the editor is used. */
  toolbar?: 'always' | 'focus'
  className?: string
  contentClassName?: string
  'aria-label'?: string
}) {
  const { data: mentionables = [] } = useMentionables()
  const all = useMemo(() => [SALAMI, SALAMI_CUP, ...mentionables], [mentionables])
  const allRef = useRef(all)

  const [menu, setMenu] = useState<Menu | null>(null)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(!!autoFocus)
  const [uploading, setUploading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastEmitted = useRef(value)

  // TipTap reads its extensions once, so the handlers below go through refs.
  const live = useRef({ menu, active, onSubmit, onEscape, enterSubmits, onChange })
  useLayoutEffect(() => {
    allRef.current = all
    live.current = { menu, active, onSubmit, onEscape, enterSubmits, onChange }
  })

  const editor = useEditor({
    editable: !disabled,
    autofocus: autoFocus ? 'end' : false,
    content: markdownToDoc(value, variant),
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        heading: variant === 'article' ? { levels: [2, 3] } : false,
        blockquote: variant === 'article' ? {} : false,
      }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https', HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      ...(variant === 'article' ? [Image.configure({ inline: false })] : []),
      AstroMention.configure({
        suggestion: {
          char: '@',
          items: ({ query }) => filter(allRef.current, query),
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                { type: 'mention', attrs: props },
                { type: 'text', text: ' ' },
              ])
              .run()
          },
          render: () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const show = (p: SuggestionProps<Mentionable, any>) => {
              setMenu(p.items.length ? { items: p.items, command: (m) => p.command(m), rect: p.clientRect?.() ?? null, origin: wrapRef.current?.getBoundingClientRect() ?? null } : null)
              setActive(0)
            }
            return {
              onStart: show,
              onUpdate: show,
              onExit: () => setMenu(null),
              onKeyDown: ({ event }) => {
                const { menu, active } = live.current
                if (!menu) return false
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  const step = event.key === 'ArrowDown' ? 1 : -1
                  setActive((active + step + menu.items.length) % menu.items.length)
                  return true
                }
                if (event.key === 'Enter' || event.key === 'Tab') {
                  menu.command(menu.items[active])
                  return true
                }
                if (event.key === 'Escape') {
                  setMenu(null)
                  return true
                }
                return false
              },
            }
          },
        },
      }),
      Extension.create({
        name: 'astroKeys',
        priority: 1000,
        addKeyboardShortcuts() {
          const submit = () => {
            const { onSubmit, menu } = live.current
            if (!onSubmit || menu) return false
            onSubmit()
            return true
          }
          return {
            'Mod-Enter': submit,
            Enter: ({ editor }) => (live.current.enterSubmits && !editor.isActive('listItem') ? submit() : false),
            Escape: () => {
              if (live.current.menu || !live.current.onEscape) return false
              live.current.onEscape()
              return true
            },
          }
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: cn('tiptap', contentClassName),
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const md = docToMarkdown(editor.getJSON())
      lastEmitted.current = md
      live.current.onChange(md)
    },
  })

  useEffect(() => {
    if (!editor || value === lastEmitted.current) return
    lastEmitted.current = value
    editor.commands.setContent(markdownToDoc(value, variant), false)
  }, [editor, value, variant])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  const pickImage = async (file: File | undefined) => {
    if (!file || !onImageUpload || !editor) return
    setUploading(true)
    try {
      const src = await onImageUpload(file)
      editor.chain().focus().setImage({ src, alt: '' }).run()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const showToolbar = editor && (toolbar === 'always' || focused || !!value.trim())

  return (
    <div
      ref={wrapRef}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !wrapRef.current?.contains(e.relatedTarget as Node | null) && setFocused(false)}
      className={cn('astro-editor relative min-w-0 flex-1', disabled && 'opacity-60', className)}
    >
      {showToolbar && (
        <div className="mb-1.5 flex items-center gap-2 border-b border-white/[0.06] pb-1.5">
          <Toolbar editor={editor} variant={variant} onImage={onImageUpload ? () => fileRef.current?.click() : undefined} />
          {uploading && <span className="text-[11px] text-astro-text-dim">Uploading&hellip;</span>}
        </div>
      )}
      <EditorContent editor={editor} />
      {onImageUpload && <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />}
      {menu && <Picker menu={menu} active={active} setActive={setActive} />}
    </div>
  )
}
