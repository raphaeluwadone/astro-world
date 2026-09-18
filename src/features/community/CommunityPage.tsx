import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { EmptyPitchIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { MostMentioned } from './components/MostMentioned'
import { PostCard } from './components/PostCard'
import { PostComposer } from './components/PostComposer'
import { TagPool } from './components/TagPool'
import { useCreatePost, useFeed, useMostMentioned, useTagPool, useToggleLike } from './hooks'

export function CommunityPage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: feed = [], isLoading: feedLoading } = useFeed(playerId)
  const { data: mentioned = [] } = useMostMentioned()
  const { data: tags = [] } = useTagPool()
  const createPost = useCreatePost(playerId)
  const toggleLike = useToggleLike(playerId)

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Community
      </h1>
      <p className="mb-6.5 text-sm text-astro-text-muted">Where the excuses live.</p>

      <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
        <div className="flex min-w-0 flex-col gap-3.5">
          <PostComposer
            disabled={!playerId}
            isSubmitting={createPost.isPending}
            onSubmit={(content) => createPost.mutate(content)}
          />

          {feedLoading ? (
            <PageLoader />
          ) : feed.length === 0 ? (
            <EmptyState icon={<EmptyPitchIcon />} title="Nobody's said anything yet." body="Be the keen one." />
          ) : (
            feed.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canLike={!!playerId}
                onToggleLike={() =>
                  toggleLike.mutate({ postId: post.id, liked: !post.likedByMe })
                }
              />
            ))
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <MostMentioned mentioned={mentioned} />
          <TagPool tags={tags} />
        </div>
      </div>
    </div>
  )
}
