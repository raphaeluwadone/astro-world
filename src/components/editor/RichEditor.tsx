import { Extension, mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { NodeSelection } from '@tiptap/pm/state'
import { BubbleMenu, EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { SuggestionProps } from '@tiptap/suggestion'
import { cn } from 'cn'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  AtSign,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMentionables } from '@/features/community/hooks'
import { KindGlyph, mentionText, tierSwatch } from '@/features/community/mentions/MentionChip'
import { filter, GROUPS } from '@/features/community/mentions/MentionField'
import { SALAMI, SALAMI_CUP, sigil, type MentionKind, type Mentionable } from '@/features/community/mentions/tokens'
import { imageLayoutClass } from './imageLayout'
import { docToMarkdown, IMAGE_ALIGNS, IMAGE_SIZES, markdownToDoc, type ImageAlign, type ImageSize, type Variant } from './markdown'

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: { default: 'full', parseHTML: (el) => el.dataset.size, renderHTML: (a) => ({ 'data-size': a.size }) },
      align: { default: 'center', parseHTML: (el) => el.dataset.align, renderHTML: (a) => ({ 'data-align': a.align }) },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: imageLayoutClass(node.attrs.size, node.attrs.align) })]
  },
}).configure({ inline: false })

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

/** "bubble" floats over highlighted text, so it leaves out what would replace the selection. "context" opens on right-click. */
type ToolbarMode = 'bar' | 'bubble' | 'context'

function Toolbar({ editor, variant, onImage, mode = 'bar' }: { editor: Editor; variant: Variant; onImage?: () => void; mode?: ToolbarMode }) {
  const [linking, setLinking] = useState<string | null>(null)
  const c = () => editor.chain().focus()
  const floating = mode !== 'bar'

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
        className={cn('flex items-center gap-1.5', floating && 'w-64 max-w-full')}
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
      {onImage && mode !== 'bubble' && (
        <ToolButton label="Image" onClick={onImage}>
          <ImagePlus size={15} />
        </ToolButton>
      )}
      {mode !== 'bubble' && (
        <ToolButton
          label="Tag someone"
          onClick={() => {
            // Right-clicking a word selects it; tagging goes after it instead of replacing it.
            const { selection, doc } = editor.state
            const at = mode === 'context' ? selection.to : selection.from
            const spaced = doc.resolve(at).nodeBefore?.text?.endsWith(' ') === false ? ' @' : '@'
            if (mode === 'context' && !selection.empty) c().setTextSelection(at).insertContent(spaced).run()
            else c().insertContent(spaced).run()
          }}
        >
          <AtSign size={14} />
        </ToolButton>
      )}
    </div>
  )
}

const FLOAT_MENU = 'flex max-w-[calc(100vw-16px)] items-center rounded-lg border border-white/[0.1] bg-astro-surface-2 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]'

/** Selects the word under the pointer so a right-click formats it, unless the click landed inside an existing selection. */
function selectWordAt(editor: Editor, x: number, y: number) {
  const { state, view } = editor
  const hit = view.posAtCoords({ left: x, top: y })
  if (!hit) return
  const { from, to } = state.selection
  if (from !== to && hit.pos >= from && hit.pos <= to) return
  const $pos = state.doc.resolve(hit.pos)
  if (!$pos.parent.isTextblock) return
  const text = $pos.parent.textBetween(0, $pos.parent.content.size, undefined, '￼')
  const isWord = (ch: string) => /[\p{L}\p{N}'’_-]/u.test(ch)
  let a = $pos.parentOffset
  let b = a
  while (a > 0 && isWord(text[a - 1])) a--
  while (b < text.length && isWord(text[b])) b++
  if (a === b) editor.commands.setTextSelection(hit.pos)
  else editor.commands.setTextSelection({ from: $pos.start() + a, to: $pos.start() + b })
}

/** The full formatting toolbar, opened at the pointer by a right-click. */
function ContextMenu({ at, editor, variant, onImage, onClose }: { at: { x: number; y: number }; editor: Editor; variant: Variant; onImage?: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: at.x, top: at.y + 8 })

  useLayoutEffect(() => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({ left: Math.max(8, Math.min(at.x, window.innerWidth - r.width - 8)), top: Math.max(8, Math.min(at.y + 8, window.innerHeight - r.height - 8)) })
  }, [at])

  useEffect(() => {
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
      editor.commands.focus()
    }
    document.addEventListener('mousedown', down, true)
    document.addEventListener('keydown', key, true)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    editor.on('update', onClose)
    return () => {
      document.removeEventListener('mousedown', down, true)
      document.removeEventListener('keydown', key, true)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
      editor.off('update', onClose)
    }
  }, [editor, onClose])

  return createPortal(
    <div ref={ref} role="dialog" aria-label="Formatting" style={pos} className={cn(FLOAT_MENU, 'fixed z-[100]')}>
      <Toolbar editor={editor} variant={variant} mode="context" onImage={onImage} />
    </div>,
    document.body,
  )
}

/** Swaps the selected image with the block above or below it, within the same parent. */
function moveImage(editor: Editor, dir: -1 | 1) {
  const { state } = editor
  const sel = state.selection
  if (!(sel instanceof NodeSelection)) return
  const $pos = state.doc.resolve(sel.from)
  const target = $pos.index() + dir
  if (target < 0 || target >= $pos.parent.childCount) return
  const sibling = $pos.parent.child(target)
  const at = dir < 0 ? sel.from - sibling.nodeSize : sel.from + sibling.nodeSize
  const tr = state.tr.delete(sel.from, sel.to).insert(at, sel.node)
  tr.setSelection(NodeSelection.create(tr.doc, at))
  editor.view.dispatch(tr.scrollIntoView())
  editor.commands.focus()
}

const SIZE_LABEL: Record<ImageSize, string> = { small: 'S', medium: 'M', full: 'Full' }
const ALIGN_ICON: Record<ImageAlign, typeof AlignLeft> = { left: AlignLeft, center: AlignCenter, right: AlignRight }

function ImageMenu({ editor }: { editor: Editor }) {
  const { size, align } = editor.getAttributes('image') as { size: ImageSize; align: ImageAlign }
  const set = (attrs: Partial<{ size: ImageSize; align: ImageAlign }>) => editor.chain().focus().updateAttributes('image', attrs).run()
  const divider = <span className="mx-0.5 h-4 w-px bg-white/[0.1]" />

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageMenu"
      shouldShow={({ editor }) => editor.isEditable && editor.isActive('image')}
      tippyOptions={{ placement: 'top', maxWidth: 'none' }}
      className="flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-astro-surface-2 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
    >
      {IMAGE_SIZES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={size === s}
          title={`${s[0].toUpperCase()}${s.slice(1)} size`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => set({ size: s })}
          className={cn(
            'h-7 min-w-7 rounded-md px-1.5 text-[11.5px] font-extrabold text-astro-text-dim hover:bg-white/[0.06] hover:text-astro-text',
            size === s && 'bg-astro-accent/20 text-astro-text',
          )}
        >
          {SIZE_LABEL[s]}
        </button>
      ))}
      {size !== 'full' && (
        <>
          {divider}
          {IMAGE_ALIGNS.map((a) => {
            const Icon = ALIGN_ICON[a]
            return (
              <ToolButton key={a} label={`Align ${a}`} active={align === a} onClick={() => set({ align: a })}>
                <Icon size={15} />
              </ToolButton>
            )
          })}
        </>
      )}
      {divider}
      <ToolButton label="Move up" onClick={() => moveImage(editor, -1)}>
        <ArrowUp size={15} />
      </ToolButton>
      <ToolButton label="Move down" onClick={() => moveImage(editor, 1)}>
        <ArrowDown size={15} />
      </ToolButton>
      {divider}
      <ToolButton label="Remove image" onClick={() => editor.chain().focus().deleteSelection().run()}>
        <Trash2 size={14} />
      </ToolButton>
    </BubbleMenu>
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
  /** "focus" keeps the toolbar hidden until the editor is used. "selection" has no bar: formatting floats over highlighted text and opens at the pointer on right-click. */
  toolbar?: 'always' | 'focus' | 'selection'
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
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)
  // Read by the floating menu's shouldShow, which TipTap registers once, so it has to be a ref.
  const ctxOpen = useRef(false)
  const closeCtx = useCallback(() => {
    ctxOpen.current = false
    setCtx(null)
  }, [])
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
      ...(variant === 'article' ? [ArticleImage] : []),
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

  const showToolbar = editor && toolbar !== 'selection' && (toolbar === 'always' || focused || !!value.trim())
  const floating = toolbar === 'selection'

  const onContextMenu = (e: ReactMouseEvent) => {
    const target = e.target as HTMLElement
    // Shift + right-click keeps the browser's own menu, for spelling help.
    if (!editor || !floating || !editor.isEditable || e.shiftKey || !target.closest('.tiptap') || target.closest('img')) return
    e.preventDefault()
    const byKeyboard = e.button !== 2 && !e.ctrlKey
    const caret = byKeyboard ? editor.view.coordsAtPos(editor.state.selection.to) : null
    // Flag it before the selection moves, so the highlight bubble never flashes up behind the menu.
    ctxOpen.current = true
    if (!byKeyboard) selectWordAt(editor, e.clientX, e.clientY)
    setCtx(caret ? { x: caret.left, y: caret.bottom } : { x: e.clientX, y: e.clientY })
  }

  const chooseImage = () => {
    if (editor && !editor.state.selection.empty) editor.commands.setTextSelection(editor.state.selection.to)
    closeCtx()
    fileRef.current?.click()
  }

  return (
    <div
      ref={wrapRef}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !wrapRef.current?.contains(e.relatedTarget as Node | null) && setFocused(false)}
      onContextMenu={onContextMenu}
      className={cn('astro-editor relative min-w-0 flex-1', disabled && 'opacity-60', className)}
    >
      {showToolbar && (
        <div className="mb-1.5 flex items-center gap-2 border-b border-white/[0.06] pb-1.5">
          <Toolbar editor={editor} variant={variant} onImage={onImageUpload ? () => fileRef.current?.click() : undefined} />
          {uploading && <span className="text-[11px] text-astro-text-dim">Uploading&hellip;</span>}
        </div>
      )}
      <EditorContent editor={editor} />
      {editor && floating && (
        <BubbleMenu
          editor={editor}
          pluginKey="formatMenu"
          shouldShow={({ editor, state }) => editor.isEditable && !state.selection.empty && !(state.selection instanceof NodeSelection) && !ctxOpen.current}
          tippyOptions={{ placement: 'top', maxWidth: 'calc(100vw - 16px)' }}
          className={FLOAT_MENU}
        >
          <Toolbar editor={editor} variant={variant} mode="bubble" />
        </BubbleMenu>
      )}
      {editor && floating && ctx && (
        <ContextMenu at={ctx} editor={editor} variant={variant} onImage={onImageUpload ? chooseImage : undefined} onClose={closeCtx} />
      )}
      {editor && uploading && floating && <span className="mt-1 block text-[11px] text-astro-text-dim">Uploading&hellip;</span>}
      {editor && variant === 'article' && <ImageMenu editor={editor} />}
      {onImageUpload && <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />}
      {menu && <Picker menu={menu} active={active} setActive={setActive} />}
    </div>
  )
}
