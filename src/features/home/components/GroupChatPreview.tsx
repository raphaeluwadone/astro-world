import { NothingHere } from '@/components/states/NothingHere'
import { Scene } from '@/components/states/Scene'
import { Link } from '@tanstack/react-router'
import type { PostRow } from '@/features/community/api'
import { BUBBLE, HEART, THUMB_DOWN } from '@/features/community/components/reactionIcons'
import { plainText } from '@/features/community/mentions/tokens'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'

function relativeTime(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function Count({ color, d, n, label }: { color: string; d: string; n: number; label: string }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${n} ${label}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill={color} aria-hidden>
        <path d={d} />
      </svg>
      {n}
    </span>
  )
}

export function GroupChatPreview({ posts }: { posts: PostRow[] }) {
  const recent = posts.slice(0, 3)
  return (
    <div className="astro-card p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none text-astro-text">From the Group Chat</h2>
        <Link to="/community" className="text-xs font-extrabold text-astro-accent">
          Feed
        </Link>
      </div>
      {recent.length === 0 ? (
        <NothingHere compact icon={<Scene kind="chat" />} body="Nobody's posted anything yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((p, i) => (
            <Link
              key={p.id}
              to="/community"
              search={{ post: p.id }}
              className={`group flex gap-3 no-underline ${i < recent.length - 1 ? 'border-b border-border pb-3' : ''}`}
            >
              <PlayerPhoto playerId={p.author.id} alt="" className="size-[34px] rounded-lg" />
              <div className="min-w-0">
                <div className="mb-0.5 text-[13px] font-extrabold text-astro-text">
                  {p.author.nickname} <BadgeMark playerId={p.author.id} size={14} />{' '}
                  <span className="font-medium text-astro-text-dim">&middot; {relativeTime(p.created_at)}</span>
                </div>
                <div className="line-clamp-3 text-[13px] text-astro-text-muted [text-wrap:pretty] group-hover:text-astro-text">{plainText(p.content)}</div>
                {(p.likeCount > 0 || p.dislikeCount > 0 || p.replyCount > 0) && (
                  <div className="mt-1.5 flex gap-3 text-[11.5px] font-bold text-astro-text-dim">
                    {p.likeCount > 0 && <Count color="#38bdf8" d={HEART} n={p.likeCount} label={p.likeCount === 1 ? 'like' : 'likes'} />}
                    {p.dislikeCount > 0 && <Count color="#e0483f" d={THUMB_DOWN} n={p.dislikeCount} label={p.dislikeCount === 1 ? 'dislike' : 'dislikes'} />}
                    {p.replyCount > 0 && <Count color="#c589ff" d={BUBBLE} n={p.replyCount} label={p.replyCount === 1 ? 'reply' : 'replies'} />}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
