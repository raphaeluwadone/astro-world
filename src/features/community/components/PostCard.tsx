import { Link } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'
import type { PostRow } from '../api'
import { useCreateReply, useDeleteReply, useReplies } from '../hooks'
import { PostContent } from '../mentions/MentionChip'

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

const HEART = 'M12 21.4C12 21.4 3.6 16.2 3.6 10.5A4.7 4.7 0 0 1 12 7.2a4.7 4.7 0 0 1 8.4 3.3c0 5.7-8.4 10.9-8.4 10.9Z'
const THUMB_DOWN =
  'M15 3H6.3a2 2 0 0 0-2 1.6l-1.3 6.6A2 2 0 0 0 5 13.6h5.1l-.8 4a2 2 0 0 0 .5 1.8l.9.9 5.6-5.8a2 2 0 0 0 .6-1.4V5a2 2 0 0 0-2-2Zm4 0h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1Z'
const BUBBLE = 'M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'

function Replies({ postId, canReply }: { postId: string; canReply: boolean }) {
  const { player } = useCurrentPlayer()
  const { data: replies = [], isLoading } = useReplies(postId, true)
  const create = useCreateReply(postId, player?.id ?? null)
  const remove = useDeleteReply(postId)
  const [text, setText] = useState('')

  const send = () => {
    if (!text.trim()) return
    create.mutate(text, { onSuccess: () => setText(''), onError: () => toast.error('Couldn’t send that reply. Try again.') })
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
                    <Link to="/players/$playerId" params={{ playerId: r.author.id }} className="font-extrabold text-astro-text hover:underline">
                      {r.author.nickname}
                    </Link>
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
                  <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-snug text-astro-text [overflow-wrap:anywhere]">{r.content}</p>
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
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Reply…"
            aria-label="Write a reply"
            className="min-h-[38px] flex-1 resize-none rounded-[10px] border border-white/[0.12] bg-astro-surface-2 px-3 py-2 text-[13.5px] text-astro-text placeholder:text-astro-text-dim focus:border-astro-accent/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || create.isPending}
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
            {post.author.nickname}
            <BadgeMark playerId={post.author.id} max={2} />
          </div>
          <div className="text-[11.5px] text-astro-text-dim">
            {post.author.full_name} &middot; {relativeTime(post.created_at)}
          </div>
        </div>
      </div>
      <p className="mb-3.5 text-[14.5px] leading-[1.5] text-astro-text [text-wrap:pretty]">
        <PostContent content={post.content} />
      </p>
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
      {showReplies && <Replies postId={post.id} canReply={canLike} />}
    </div>
  )
}
