import { Link } from '@tanstack/react-router'
import type { PostRow } from '@/features/community/api'

function relativeTime(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
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
        <p className="text-sm text-astro-text-dim">Nobody's posted anything yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((p, i) => (
            <div
              key={p.id}
              className={
                i < recent.length - 1
                  ? 'flex gap-3 border-b border-border pb-3'
                  : 'flex gap-3'
              }
            >
              <div
                className="size-[34px] shrink-0 rounded-lg"
                style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
              />
              <div className="min-w-0">
                <div className="mb-0.5 text-[13px] font-extrabold text-astro-text">
                  {p.author.nickname}{' '}
                  <span className="font-medium text-astro-text-dim">&middot; {relativeTime(p.created_at)}</span>
                </div>
                <div className="text-[13px] text-astro-text-muted [text-wrap:pretty]">{p.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
