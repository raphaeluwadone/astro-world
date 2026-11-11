import { useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { LiveMatchday } from '@/features/matchday/components/LiveMatchday'
import { DayTableCard } from '@/features/matchday/components/DayTableCard'
import { CupTableCard } from '@/features/salami-cup/components/CupTableCard'
import { MostMentioned } from './components/MostMentioned'
import { PostCard } from './components/PostCard'
import { PostComposer } from './components/PostComposer'
import { TagPool } from './components/TagPool'
import { useCreatePost, useFeed, useLinkedPost, useMostMentioned, useTagPool, useToggleDislike, useToggleLike } from './hooks'

export function CommunityPage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: feed = [], isLoading: feedLoading, isError: feedError, refetch: refetchFeed } = useFeed(playerId)
  const { data: mentioned = [] } = useMostMentioned()
  const { data: tags = [] } = useTagPool()
  const createPost = useCreatePost(playerId)
  const toggleLike = useToggleLike(playerId)
  const toggleDislike = useToggleDislike(playerId)

  const { post: linkedId } = useSearch({ from: '/_app/community/' })
  const inFeed = !!linkedId && feed.some((p) => p.id === linkedId)
  const { data: linkedPost, isFetched: linkedFetched } = useLinkedPost(linkedId, playerId, !feedLoading && !inFeed)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const linkedReady = inFeed || !!linkedPost

  useEffect(() => {
    if (!linkedId || !linkedReady) return
    document.getElementById(`post-${linkedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightId(linkedId)
    const t = setTimeout(() => setHighlightId(null), 2400)
    return () => clearTimeout(t)
  }, [linkedId, linkedReady])

  const renderPost = (post: (typeof feed)[number]) => (
    <PostCard
      key={post.id}
      post={post}
      highlighted={highlightId === post.id}
      canLike={!!playerId}
      onToggleLike={() => toggleLike.mutate({ postId: post.id, liked: !post.likedByMe })}
      onToggleDislike={() => toggleDislike.mutate({ postId: post.id, disliked: !post.dislikedByMe })}
    />
  )

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Community
      </h1>
      <p className="mb-6.5 text-sm text-astro-text-muted">Where the excuses live.</p>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <LiveMatchday showTable={false} />
          <PostComposer
            disabled={!playerId}
            isSubmitting={createPost.isPending}
            onSubmit={(text, mentions) => createPost.mutate({ text, mentions })}
          />

          {!inFeed && linkedPost && (
            <div className="flex flex-col gap-2">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-accent">Linked post</div>
              {renderPost(linkedPost)}
              <div className="mt-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-text-dim">Latest</div>
            </div>
          )}
          {linkedId && !inFeed && linkedFetched && !linkedPost && (
            <div className="rounded-xl border border-white/[0.07] bg-astro-surface px-4 py-3 text-[13px] text-astro-text-muted">
              That post has been deleted, or the link is wrong.
            </div>
          )}

          {feedLoading ? (
            <PageLoader />
          ) : feedError ? (
            <ErrorState onRetry={() => refetchFeed()} />
          ) : feed.length === 0 ? (
            <EmptyState icon={<EmptyPitchIcon />} title="Nobody's said anything yet." body="Be the keen one." />
          ) : (
            feed.map(renderPost)
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <MostMentioned mentioned={mentioned} />
          <DayTableCard phase="during" />
          <CupTableCard phase="during" />
          <TagPool tags={tags} />
          <DayTableCard phase="after" />
          <CupTableCard phase="after" />
        </div>
      </div>
    </div>
  )
}
