import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { RichEditor } from '@/components/editor/RichEditor'
import { mentionsIn } from '@/components/editor/markdown'
import type { Mentionable } from '../mentions/tokens'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'

export function PostComposer({
  disabled,
  onSubmit,
  isSubmitting,
}: {
  disabled: boolean
  onSubmit: (text: string, mentions: Mentionable[]) => void
  isSubmitting: boolean
}) {
  const { player } = useCurrentPlayer()
  const [content, setContent] = useState('')

  function submit() {
    const trimmed = content.trim()
    if (!trimmed || disabled || isSubmitting) return
    onSubmit(trimmed, mentionsIn(trimmed))
    setContent('')
  }

  return (
    <div className="astro-card relative px-[18px] py-4">
      <div className="flex items-start gap-3">
        <PlayerPhoto playerId={player?.id} alt="" className="size-[38px] shrink-0 rounded-[10px]" />
        <RichEditor
          value={content}
          onChange={setContent}
          enterSubmits
          onSubmit={submit}
          toolbar="focus"
          disabled={disabled}
          placeholder="Say something regrettable… type @ to tag"
          aria-label="Write a post"
          className="self-center"
          contentClassName="py-2 text-sm text-astro-text"
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
    </div>
  )
}
