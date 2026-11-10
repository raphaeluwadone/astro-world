import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { PostRow } from '../api'
import { useCreateReply, useDeleteReply, useReplies } from '../hooks'
import { RichEditor } from '@/components/editor/RichEditor'
import { RichText } from '@/components/editor/RichText'
import { BUBBLE, HEART, THUMB_DOWN } from './reactionIcons'
import { PlayerHoverCard } from '@/components/hover/InfoCards'

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function ReactionButton({
  active,
  color,
  disabled,
  onClick,
  label,
  children,
}: {
  active: boolean
  color: string
  disabled?: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className="flex items-center gap-[7px] rounded-full border bg-[#182448] px-3.5 py-1.5 transition-colors hover:bg-[#1e2c56] disabled:opacity-60"
      style={{ borderColor: active ? color : `color-mix(in srgb, ${color} 30%, transparent)`, color }}
    >
      {children}
    </button>
  )
}

function Replies({ postId, canReply, onCancel }: { postId: string; canReply: boolean; onCancel: () => void }) {
  const { player } = useCurrentPlayer()
  const { data: replies = [], isLoading } = useReplies(postId, true)
  const create = useCreateReply(postId, player?.id ?? null)
  const remove = useDeleteReply(postId)
  const [text, setText] = useState('')

  const send = () => {
    if (!text.trim() || text.length > 1000 || create.isPending) return
    create.mutate(text.trim(), { onSuccess: () => setText(''), onError: () => toast.error('Couldn’t send that reply. Try again.') })
  }

  return (
    <div className="mt-3.5 border-t border-white/[0.06] pt-3">
      {isLoading ? (
        <div className="py-2 text-xs text-astro-text-dim">Loading replies…</div>
      ) : (
        replies.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2.5">
            {replies.map((r) => (
              <li key={r.id} className="flex gap-2.5">
                <PlayerPhoto playerId={r.author.id} alt="" className="size-7 rounded-[8px]" />
                <div className="min-w-0 flex-1 rounded-xl bg-astro-surface-2 px-3 py-2">
                  <div className="flex items-baseline gap-2 text-xs">
                    <PlayerHoverCard playerId={r.author.id} name={r.author.nickname} className="font-extrabold text-astro-text hover:underline">
                      {r.author.nickname}
                    </PlayerHoverCard>
                    <span className="text-astro-text-dim">{relativeTime(r.created_at)}</span>
                    {(r.author.id === player?.id || player?.is_admin) && (
                      <button
                        type="button"
                        onClick={() => remove.mutate(r.id)}
                        className="ml-auto text-[11px] font-bold text-astro-text-dim hover:text-astro-red"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <RichText content={r.content} gap="gap-1" className="mt-0.5 text-[13.5px] leading-snug text-astro-text" />
                </div>
              </li>
            ))}
          </ul>
        )
      )}
      {canReply && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <div className="min-h-[38px] min-w-0 flex-1 rounded-[10px] border border-white/[0.12] bg-astro-surface-2 px-3 py-1.5 focus-within:border-astro-accent/60">
            <RichEditor
              value={text}
              onChange={setText}
              autoFocus
              enterSubmits
              onSubmit={send}
              onEscape={() => {
                setText('')
                onCancel()
              }}
              toolbar="focus"
              placeholder="Reply…"
              aria-label="Write a reply"
              contentClassName="py-0.5 text-[13.5px] text-astro-text"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setText('')
              onCancel()
            }}
            className="min-h-[38px] rounded-[10px] px-2.5 text-[12.5px] font-bold text-astro-text-dim hover:text-astro-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim() || text.length > 1000 || create.isPending}
            className="min-h-[38px] rounded-[10px] bg-astro-accent px-3.5 text-[12.5px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? 'Sending…' : 'Reply'}
          </button>
        </form>
      )}
    </div>
  )
}

export function PostCard({
  post,
  onToggleLike,
  onToggleDislike,
  canLike,
  highlighted,
}: {
  post: PostRow
  onToggleLike: () => void
  onToggleDislike: () => void
  canLike: boolean
  highlighted?: boolean
}) {
  const [showReplies, setShowReplies] = useState(false)

  // A linked post (for example from a reply notification) opens its thread.
  useEffect(() => {
    if (highlighted && post.replyCount > 0) setShowReplies(true)
  }, [highlighted, post.replyCount])

  return (
    <div
      id={`post-${post.id}`}
      className={`astro-card scroll-mt-24 p-5 transition-[box-shadow,border-color] duration-700 ${highlighted ? 'border-astro-accent/70 shadow-[0_0_0_3px_rgba(166,63,255,0.25)]' : ''}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <PlayerPhoto playerId={post.author.id} alt="" className="size-10 rounded-[10px]" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-astro-text">
            <PlayerHoverCard playerId={post.author.id} name={post.author.nickname} className="hover:underline">
              {post.author.nickname}
            </PlayerHoverCard>
            <BadgeMark playerId={post.author.id} max={2} />
          </div>
          <div className="text-[11.5px] text-astro-text-dim">
            {post.author.full_name} &middot; {relativeTime(post.created_at)}
          </div>
        </div>
      </div>
      <RichText content={post.content} className="mb-3.5 text-[14.5px] leading-[1.5] text-astro-text [text-wrap:pretty]" />
      <div className="flex flex-wrap gap-[9px]">
        <ReactionButton active={post.likedByMe} color="#38bdf8" disabled={!canLike} onClick={onToggleLike} label={`Like, ${post.likeCount}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={HEART} />
          </svg>
          <span className="text-xs font-bold">{post.likeCount}</span>
        </ReactionButton>
        <ReactionButton
          active={post.dislikedByMe}
          color="#e0483f"
          disabled={!canLike}
          onClick={onToggleDislike}
          label={`Dislike, ${post.dislikeCount}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={THUMB_DOWN} />
          </svg>
          <span className="text-xs font-bold">{post.dislikeCount}</span>
        </ReactionButton>
        <ReactionButton
          active={showReplies}
          color="#c589ff"
          onClick={() => setShowReplies((s) => !s)}
          label={`${post.replyCount} ${post.replyCount === 1 ? 'reply' : 'replies'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={BUBBLE} />
          </svg>
          <span className="text-xs font-bold">
            {post.replyCount > 0 ? `${post.replyCount} ${post.replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
          </span>
        </ReactionButton>
      </div>
      {showReplies && <Replies postId={post.id} canReply={canLike} onCancel={() => setShowReplies(false)} />}
    </div>
  )
}
