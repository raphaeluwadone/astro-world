import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MentionField, taggedIn } from '@/features/community/mentions/MentionField'
import type { Mentionable } from '@/features/community/mentions/tokens'
import { decodeForEdit, type HonoursPost } from '../api'
import { useSaveHonoursPost } from '../hooks'

/** Admin-only. Starts collapsed for a new post; opens straight away when editing. */
export function HonoursComposer({ authorId, editing, onDone }: { authorId: string; editing?: HonoursPost; onDone?: () => void }) {
  const initial = editing ? decodeForEdit(editing.content) : { text: '', picked: [] as Mentionable[] }
  const [open, setOpen] = useState(!!editing)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [text, setText] = useState(initial.text)
  const [picked, setPicked] = useState<Mentionable[]>(initial.picked)
  const save = useSaveHonoursPost(authorId)

  function close() {
    setOpen(false)
    setTitle('')
    setText('')
    setPicked([])
    onDone?.()
  }

  function submit() {
    if (!title.trim() || !text.trim()) return
    save.mutate(
      { id: editing?.id, title, text, picked: taggedIn(text, picked) },
      {
        onSuccess: () => {
          toast.success(editing ? 'Post updated' : 'Posted to Honours')
          close()
        },
        onError: () => toast.error("Couldn't save that post."),
      },
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[rgba(166,63,255,0.35)] bg-astro-surface px-5 py-4 text-left text-sm font-bold text-astro-text-muted transition-colors hover:border-astro-accent/60 hover:text-astro-text"
      >
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-astro-accent/15 text-lg text-astro-accent-soft">+</span>
        Write an honours post
        <span className="ml-auto text-[11px] font-extrabold uppercase tracking-[0.12em] text-astro-text-dim">Admins</span>
      </button>
    )
  }

  return (
    <div className="astro-card p-5">
      {!editing && <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">New honours post</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Headline"
        aria-label="Headline"
        autoFocus
        className="mb-2.5 w-full rounded-[10px] border border-white/[0.09] bg-astro-surface-2 px-3 py-2.5 font-display text-[26px] leading-none text-astro-text placeholder:text-astro-text-dim focus:outline-none focus-visible:border-astro-accent/60"
      />
      <div className="rounded-[10px] border border-white/[0.09] bg-astro-surface-2 focus-within:border-astro-accent/60">
        <MentionField
          multiline
          rows={5}
          value={text}
          onChange={setText}
          picked={picked}
          onPickedChange={setPicked}
          placeholder="The write-up. Type @ to tag players, badges or the Salami Cup."
          aria-label="Write-up"
          className="px-3 py-2.5 text-[14.5px] leading-[1.5]"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onClick={close} disabled={save.isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!title.trim() || !text.trim() || save.isPending}>
          {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Post to Honours'}
        </Button>
      </div>
    </div>
  )
}
