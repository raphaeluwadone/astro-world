import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'

export function PostComposer({
  disabled,
  onSubmit,
  isSubmitting,
}: {
  disabled: boolean
  onSubmit: (content: string) => void
  isSubmitting: boolean
}) {
  const [content, setContent] = useState('')

  function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setContent('')
  }

  return (
    <div className="astro-card flex items-center gap-3 px-[18px] py-4">
      <div
        className="size-[38px] shrink-0 rounded-[10px]"
        style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
      />
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={disabled}
        placeholder="Say something regrettable…"
        className="flex-1 bg-transparent text-sm text-astro-text placeholder:text-astro-text-dim focus:outline-none"
      />
      <button
        type="button"
        disabled={disabled || isSubmitting || !content.trim()}
        onClick={submit}
        className="flex items-center gap-2 rounded-[10px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 px-4 py-2.5 text-[13px] font-extrabold text-astro-accent disabled:opacity-50"
      >
        {isSubmitting && <InlineLoader size={14} />}
        Post
      </button>
    </div>
  )
}
