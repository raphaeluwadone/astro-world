import type { PostRow } from '../api'

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function PostCard({
  post,
  onToggleLike,
  canLike,
}: {
  post: PostRow
  onToggleLike: () => void
  canLike: boolean
}) {
  return (
    <div className="astro-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-[10px]"
          style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
        />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-astro-text">{post.author.nickname}</div>
          <div className="text-[11.5px] text-astro-text-dim">
            {post.author.full_name} &middot; {relativeTime(post.created_at)}
          </div>
        </div>
      </div>
      <p className="mb-3.5 text-[14.5px] leading-[1.5] text-astro-text [text-wrap:pretty]">
        {post.content}
      </p>
      <div className="flex flex-wrap gap-[9px]">
        <button
          type="button"
          disabled={!canLike}
          onClick={onToggleLike}
          className="flex items-center gap-[7px] rounded-full border px-3.5 py-1.5 disabled:opacity-60"
          style={{
            background: '#182448',
            borderColor: post.likedByMe ? '#38bdf8' : 'rgba(56,189,248,0.3)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#38bdf8">
            <path d="M12 21.4C12 21.4 3.6 16.2 3.6 10.5A4.7 4.7 0 0 1 12 7.2a4.7 4.7 0 0 1 8.4 3.3c0 5.7-8.4 10.9-8.4 10.9Z" />
          </svg>
          <span className="text-xs font-bold text-astro-cyan">{post.likeCount}</span>
        </button>
      </div>
    </div>
  )
}
