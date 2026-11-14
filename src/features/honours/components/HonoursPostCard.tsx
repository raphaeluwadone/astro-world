import { undoToast } from '@/components/dialogs/confirm'
import { cn } from 'cn'
import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeMark } from '@/features/badges/components/BadgeMark'
import { RichText } from '@/components/editor/RichText'
import { REACTIONS, type HonoursPost, type ReactionKey } from '../api'
import { useDeleteHonoursPost, useSetHonoursPin, useToggleReaction } from '../hooks'
import { HonoursComposer } from './HonoursComposer'
import { PlayerHoverCard } from '@/components/hover/InfoCards'

const EMOJI = Object.fromEntries(REACTIONS.map((r) => [r.key, r])) as Record<ReactionKey, (typeof REACTIONS)[number]>

export function shortDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Reactions({ post, playerId }: { post: HonoursPost; playerId: string | null }) {
  const toggle = useToggleReaction(playerId)
  const [picking, setPicking] = useState(false)
  const unused = REACTIONS.filter((r) => !post.reactions.some((x) => x.key === r.key))

  function react(key: ReactionKey, on: boolean) {
    if (!playerId) return
    setPicking(false)
    toggle.mutate({ postId: post.id, reaction: key, on }, { onError: () => toast.error("Couldn't save your reaction.") })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {post.reactions.map((r) => (
        <button
          key={r.key}
          type="button"
          disabled={!playerId}
          aria-pressed={r.mine}
          aria-label={`${EMOJI[r.key].label}, ${r.count}`}
          onClick={() => react(r.key, !r.mine)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[12.5px] font-bold transition-colors',
            r.mine
              ? 'border-astro-accent/55 bg-astro-accent/15 text-astro-text'
              : 'border-white/[0.08] bg-astro-surface-2 text-astro-text-muted hover:text-astro-text',
          )}
        >
          <span aria-hidden="true">{EMOJI[r.key].emoji}</span>
          {r.count}
        </button>
      ))}
      {playerId && unused.length > 0 && (
        <div className="relative">
          <button
            type="button"
            aria-label="Add a reaction"
            aria-expanded={picking}
            onClick={() => setPicking((p) => !p)}
            className="inline-flex h-[27px] min-w-[32px] items-center justify-center rounded-full border border-dashed border-white/[0.15] px-2 text-[13px] font-bold text-astro-text-dim hover:text-astro-text"
          >
            +
          </button>
          {picking && (
            <div className="absolute bottom-full left-0 z-20 mb-1.5 flex gap-0.5 rounded-full border border-white/[0.1] bg-astro-surface-2 p-1 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              {unused.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-label={r.label}
                  onClick={() => react(r.key, true)}
                  className="flex size-8 items-center justify-center rounded-full text-base transition-transform hover:scale-125 hover:bg-white/[0.06]"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdminActions({ post, onEdit }: { post: HonoursPost; onEdit: () => void }) {
  const pin = useSetHonoursPin()
  const remove = useDeleteHonoursPost()
  const [confirming, setConfirming] = useState(false)
  const action = 'text-[11.5px] font-bold text-astro-text-dim hover:text-astro-text disabled:opacity-50'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={action}
        disabled={pin.isPending}
        onClick={() =>
          pin.mutate(
            { id: post.id, pinned: !post.pinned },
            {
              onSuccess: () => undoToast(post.pinned ? 'Unpinned' : 'Pinned to the top', () => pin.mutate({ id: post.id, pinned: post.pinned })),
              onError: () => toast.error("Couldn't change the pin."),
            },
          )
        }
      >
        {post.pinned ? 'Unpin' : 'Pin'}
      </button>
      <button type="button" className={action} onClick={onEdit}>
        Edit
      </button>
      {confirming ? (
        <span className="flex items-center gap-2 text-[11.5px] font-bold">
          <button
            type="button"
            className="text-[#e0483f] hover:underline disabled:opacity-50"
            disabled={remove.isPending}
            onClick={() => remove.mutate(post.id, { onSuccess: () => toast.success('Post deleted'), onError: () => toast.error("Couldn't delete it.") })}
          >
            Delete for good
          </button>
          <button type="button" className={action} onClick={() => setConfirming(false)}>
            Keep
          </button>
        </span>
      ) : (
        <button type="button" className={action} onClick={() => setConfirming(true)}>
          Delete
        </button>
      )}
    </div>
  )
}

export function HonoursPostCard({ post, playerId, isAdmin }: { post: HonoursPost; playerId: string | null; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false)

  if (editing && playerId) return <HonoursComposer authorId={playerId} editing={post} onDone={() => setEditing(false)} />

  return (
    <article
      className={cn(
        'relative rounded-2xl border px-[22px] py-5',
        post.pinned
          ? 'border-[rgba(242,169,59,0.45)] bg-[linear-gradient(160deg,rgba(242,169,59,0.10),var(--astro-surface)_45%)]'
          : 'border-border bg-astro-surface',
      )}
    >
      {post.pinned && (
        <span className="absolute right-5 top-4 text-[10px] font-extrabold tracking-[0.14em] text-[#f7c25e]">PINNED</span>
      )}
      <div className="mb-2 flex items-center gap-2 pr-16 text-xs text-astro-text-dim">
        <span className="size-[22px] rounded-[7px]" style={{ background: 'linear-gradient(140deg, #2c3c74, #182448)' }} />
        {post.author ? (
          <PlayerHoverCard playerId={post.author.id} name={post.author.nickname} className="font-bold text-astro-text-muted hover:text-astro-text hover:underline">
            {post.author.nickname}
          </PlayerHoverCard>
        ) : (
          <span className="font-bold text-astro-text-muted">Admin</span>
        )}
        <BadgeMark playerId={post.author?.id} size={13} showExtra={false} />
        <span>· {shortDate(post.created_at)}</span>
      </div>
      <h3 className="mb-2 font-display text-[32px] leading-[0.95] text-astro-text [text-wrap:balance]">{post.title}</h3>
      <RichText content={post.content} className="mb-3.5 text-[14.5px] leading-[1.55] text-[#d7dcef] [text-wrap:pretty]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Reactions post={post} playerId={playerId} />
        {isAdmin && <AdminActions post={post} onEdit={() => setEditing(true)} />}
      </div>
    </article>
  )
}
