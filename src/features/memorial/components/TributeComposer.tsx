import { useState } from 'react'
import { MemorialModal } from '@/components/dialogs/MemorialModal'
import { VigilLoaderSmall } from '@/components/states/VigilLoader'

export function TributeComposer({
  disabled,
  onSubmit,
  isSubmitting,
}: {
  disabled: boolean
  onSubmit: (content: string) => void
  isSubmitting: boolean
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')

  function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setContent('')
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[rgba(203,213,245,0.35)] bg-[#151c30] px-[17px] py-3 text-[12.5px] font-bold text-[#cbd5f5] disabled:opacity-50"
      >
        Write a tribute
      </button>

      <MemorialModal
        open={open}
        onOpenChange={setOpen}
        title="Say something about Ade"
        body="It stays on his page for good, next to everyone else's. There's no length to aim for, some of the best ones are a line."
        cancelLabel="Not now"
        confirmLabel={
          isSubmitting ? (
            <span className="flex items-center gap-2">
              <VigilLoaderSmall size={14} />
              Posting&hellip;
            </span>
          ) : (
            'Post it'
          )
        }
        onConfirm={submit}
        confirmDisabled={isSubmitting || !content.trim()}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="He never once passed to me."
          className="w-full resize-none rounded-xl border border-[rgba(203,213,245,0.25)] bg-[#151c30] px-[17px] py-[15px] font-serif text-[17px] text-[#e8ecfa] placeholder:text-[#4d5578] focus:outline-none"
        />
      </MemorialModal>
    </>
  )
}
