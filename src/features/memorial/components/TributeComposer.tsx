import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'

export function TributeComposer({
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
    <div className="astro-card flex items-start gap-3.5 p-[18px]">
      <div
        className="size-10 shrink-0 rounded-[11px]"
        style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
      />
      <div className="min-w-0 flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="Write your tribute to Salami…"
          className="w-full resize-none bg-transparent text-sm text-astro-text placeholder:text-astro-text-dim focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[11.5px] text-astro-text-dim">Everyone in the group can see it</span>
          <button
            type="button"
            disabled={disabled || isSubmitting || !content.trim()}
            onClick={submit}
            className="flex items-center gap-2 rounded-[11px] bg-astro-accent px-[22px] py-3 text-[13.5px] font-extrabold text-astro-on-accent disabled:opacity-50"
          >
            {isSubmitting && <InlineLoader size={14} />}
            Post tribute
          </button>
        </div>
      </div>
    </div>
  )
}
