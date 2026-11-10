import { useState } from 'react'
import { InlineLoader } from '@/components/states/InlineLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { MentionField, taggedIn } from '../mentions/MentionField'
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
  const [picked, setPicked] = useState<Mentionable[]>([])

  function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed, taggedIn(content, picked))
    setContent('')
    setPicked([])
  }

  return (
    <div className="astro-card relative px-[18px] py-4">
      <div className="flex items-center gap-3">
        <PlayerPhoto playerId={player?.id} alt="" className="size-[38px] rounded-[10px]" />
        <MentionField
          value={content}
          onChange={setContent}
          picked={picked}
          onPickedChange={setPicked}
          onEnter={submit}
          disabled={disabled}
          placeholder="Say something regrettable… type @ to tag"
          aria-label="Write a post"
          className="text-sm"
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
