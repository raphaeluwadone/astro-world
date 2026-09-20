import { useArticles } from '@/features/articles/hooks'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useFeed } from '@/features/community/hooks'
import {
  useAvailability,
  useBallotEntries,
  useLastCompleteMatchday,
  useNextMatchday,
} from '@/features/matchday/hooks'
import { useMatchRatings } from '@/features/profile/hooks'
import { RecentForm } from '@/features/profile/components/RecentForm'
import { useRankings } from '@/features/rankings/hooks'
import { Link } from '@tanstack/react-router'
import { ArticlesPreview } from './components/ArticlesPreview'
import { GroupChatPreview } from './components/GroupChatPreview'
import { NextMatchdayCard } from './components/NextMatchdayCard'
import { RatingsPrompt } from './components/RatingsPrompt'
import { TopOfThePile } from './components/TopOfThePile'
import { useMyCommunityLikes, usePendingRatings } from './hooks'

export function HomePage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: matchday, isLoading: matchdayLoading } = useNextMatchday()
  const { data: lastComplete } = useLastCompleteMatchday()
  const { data: availability = [] } = useAvailability(matchday?.id)
  const { data: ballotEntries = [] } = useBallotEntries(matchday?.id)
  const { data: matchRatings = [] } = useMatchRatings(playerId ?? undefined)
  const { data: rankings = [] } = useRankings()
  const { data: feed = [] } = useFeed(playerId)
  const { data: articles = [] } = useArticles()
  const { data: likes = 0 } = useMyCommunityLikes(playerId ?? undefined)
  const { data: pendingRatings } = usePendingRatings(playerId ?? undefined, lastComplete?.id)

  return (
    <div>
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            Sunday football, weekly ballot
          </div>
          <h1 className="font-display text-[40px] leading-[0.95] tracking-[0.01em] text-astro-text md:text-[52px]">
            {player ? `Alright, ${player.nickname}` : 'Alright'}
          </h1>
          {matchday && (
            <div className="mt-1.5 text-sm text-astro-text-muted">
              Next up {new Date(matchday.played_at).toLocaleDateString('en-GB', { weekday: 'long' })} at{' '}
              {matchday.venue ?? 'a venue TBC'}.
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-astro-surface-2 px-3.5 py-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#38bdf8"
            style={{ animation: 'astro-beat 2.6s ease-in-out infinite' }}
          >
            <path d="M12 21.4C12 21.4 3.6 16.2 3.6 10.5A4.7 4.7 0 0 1 12 7.2a4.7 4.7 0 0 1 8.4 3.3c0 5.7-8.4 10.9-8.4 10.9Z" />
          </svg>
          <span className="text-[13px] font-bold text-astro-text">{likes}</span>
          <span className="text-xs text-astro-text-dim">likes</span>
        </div>
      </div>

      {/* Desktop reaches the memorial page from the sidebar's own "In
          memory" widget; mobile has no sidebar and the hamburger menu
          isn't wired to anything yet, so this is its only way in. */}
      <Link
        to="/memorial"
        className="mb-5 flex items-center gap-2.5 rounded-[14px] border border-[rgba(166,63,255,0.22)] bg-astro-surface-2 px-3.5 py-3 no-underline md:hidden"
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-[rgba(166,63,255,0.4)] bg-astro-surface font-display text-[15px] text-astro-accent-soft"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 74% 100%, 0 100%)' }}
        >
          13
        </div>
        <div className="min-w-0">
          <div className="text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
            In memory
          </div>
          <div className="text-[12.5px] font-extrabold text-astro-text-muted">Salami</div>
        </div>
      </Link>

      {!!pendingRatings && pendingRatings.pending > 0 && (
        <div className="mb-5">
          <RatingsPrompt pending={pendingRatings.pending} />
        </div>
      )}

      <div
        className="mb-5 grid items-start gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))' }}
      >
        {!matchdayLoading && matchday && (
          <NextMatchdayCard
            matchday={matchday}
            availability={availability}
            ballotEntries={ballotEntries}
            playerId={playerId}
          />
        )}
        <RecentForm matchRatings={matchRatings} title="Your Recent Form" titleSize={26} />
        <TopOfThePile rankings={rankings} />
      </div>

      <div
        className="grid items-start gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}
      >
        <GroupChatPreview posts={feed} />
        <ArticlesPreview articles={articles} />
      </div>
    </div>
  )
}
