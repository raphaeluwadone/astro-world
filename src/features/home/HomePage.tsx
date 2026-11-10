import { useMemo } from 'react'
import { useArticles } from '@/features/articles/hooks'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useFeed } from '@/features/community/hooks'
import {
  useAvailability,
  useLastCompleteMatchday,
  useMonthlyMembers,
  useNextMatchday,
  useStandbyEntries,
  useWeeklyClaims,
  useWeeklySpotsRemaining,
} from '@/features/matchday/hooks'
import { monthOf } from '@/features/matchday/api'
import { useMatchRatings } from '@/features/profile/hooks'
import { RecentForm } from '@/features/profile/components/RecentForm'
import type { MatchRatingRow } from '@/features/profile/api'
import { useRankings } from '@/features/rankings/hooks'
import { PlayerSearchBar } from '@/components/layout/PlayerSearchBar'
import { useCurrentCup } from '@/features/salami-cup/hooks'
import { useBadgesByPlayer } from '@/features/badges/hooks'
import { BADGE_DEFS, MONTHLY_DEFS } from '@/features/badges/definitions'
import { buildFeed, groupDrops } from '@/features/honours/feed'
import { useCupQuarters, useHonoursPosts } from '@/features/honours/hooks'
import { AwardRaceCard } from './components/AwardRaceCard'
import { CupBanner, shouldShowCupBanner } from './components/CupBanner'
import { LatestHonour, recentHonour } from './components/LatestHonour'
import { isRuleChangeRecent, RulesChangedStrip } from './components/RulesChangedStrip'
import { ArticlesPreview } from './components/ArticlesPreview'
import { GroupChatPreview } from './components/GroupChatPreview'
import { NextMatchdayCard } from './components/NextMatchdayCard'
import { QuickLinks } from './components/QuickLinks'
import { RatingsPrompt } from './components/RatingsPrompt'
import { TopOfThePile } from './components/TopOfThePile'
import { useAwardRace, useMyCommunityLikes, usePendingRatings } from './hooks'

/** "Averaging 7.6 over 5", plus a note when the latest game beats the rest of the run. */
function formSummary(ratings: MatchRatingRow[]) {
  const recent = ratings.slice(0, 5)
  if (recent.length === 0) return null
  const avg = recent.reduce((sum, r) => sum + r.avg_rating, 0) / recent.length
  const base = (
    <>
      Averaging <span className="font-extrabold text-astro-text">{avg.toFixed(1)}</span> over {recent.length}.
    </>
  )
  const [last, ...earlier] = ratings
  if (recent.length < 2 || recent.slice(1).some((r) => r.avg_rating >= last.avg_rating)) return base
  const lastBetter = earlier.find((r) => r.avg_rating >= last.avg_rating)
  const since = lastBetter
    ? `your best since ${new Date(lastBetter.played_at).toLocaleDateString('en-GB', { month: 'long' })}`
    : 'your best yet'
  return (
    <>
      {base} Your last game&rsquo;s {last.avg_rating} was {since}.
    </>
  )
}

export function HomePage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: matchday, isLoading: matchdayLoading } = useNextMatchday()
  const { data: lastComplete } = useLastCompleteMatchday()
  const { data: weeklyClaims = [] } = useWeeklyClaims(matchday?.id)
  const { data: standby = [] } = useStandbyEntries(matchday?.id)
  const { data: availability = [] } = useAvailability(matchday?.id)
  const { data: spotsRemaining = 0 } = useWeeklySpotsRemaining(matchday?.id)
  const { data: monthlyMembers = [] } = useMonthlyMembers(matchday ? monthOf(matchday.played_at) : undefined)
  const { data: matchRatings = [] } = useMatchRatings(playerId ?? undefined)
  const { data: rankings = [] } = useRankings()
  const { data: feed = [] } = useFeed(playerId)
  const { data: articles = [] } = useArticles()
  const { data: likes = 0 } = useMyCommunityLikes(playerId ?? undefined)
  const { data: pendingRatings } = usePendingRatings(playerId ?? undefined, lastComplete?.id)
  const { data: cup } = useCurrentCup()
  const { data: race = [] } = useAwardRace(!!playerId)
  const { data: honoursPosts = [] } = useHonoursPosts(playerId)
  const { data: quarters } = useCupQuarters()
  const byPlayer = useBadgesByPlayer()

  const honoursFeed = useMemo(() => buildFeed(honoursPosts, groupDrops(byPlayer, quarters), []), [honoursPosts, byPlayer, quarters])
  const latestHonour = recentHonour(honoursFeed)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newHonours = honoursFeed.filter((i) => i.type !== 'moment' && i.at.getTime() > weekAgo).length
  const awardTotal = Object.keys(BADGE_DEFS).length + Object.keys(MONTHLY_DEFS).length
  const awardsWon = playerId ? { won: new Set((byPlayer.get(playerId) ?? []).map((b) => b.badge_key)).size, total: awardTotal } : null

  const optedOut = new Set(availability.filter((a) => a.status === 'out').map((a) => a.player_id))
  const isMonthlyMember = !!playerId && monthlyMembers.some((m) => m.player_id === playerId)
  const me = {
    isMonthlyMember,
    monthlyOptStatus: availability.find((a) => a.player_id === playerId)?.status ?? null,
    hasWeeklyClaim: !!playerId && weeklyClaims.some((w) => w.player_id === playerId),
    isOnStandby: !!playerId && standby.some((s) => s.player_id === playerId),
  }

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

      <PlayerSearchBar className="mb-5 md:hidden" />

      {isRuleChangeRecent() && (
        <div className="mb-5">
          <RulesChangedStrip />
        </div>
      )}

      {latestHonour && (
        <div className="mb-5">
          <LatestHonour item={latestHonour} />
        </div>
      )}

      {shouldShowCupBanner(cup) && (
        <div className="mb-5">
          <CupBanner cup={cup} />
        </div>
      )}

      {!!pendingRatings && pendingRatings.pending > 0 && (
        <div className="mb-5">
          <RatingsPrompt pending={pendingRatings.pending} playedAt={lastComplete!.played_at} />
        </div>
      )}

      <div
        className="mb-5 grid items-start gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))' }}
      >
        {!matchdayLoading && matchday && (
          <NextMatchdayCard
            matchday={matchday}
            monthlyInCount={monthlyMembers.filter((m) => !optedOut.has(m.player_id)).length}
            weeklyCount={weeklyClaims.length}
            standbyCount={standby.length}
            spotsRemaining={spotsRemaining}
            playerId={playerId}
            me={me}
          />
        )}
        <RecentForm matchRatings={matchRatings} title="Your Recent Form" titleSize={26} summary={formSummary(matchRatings)} compact />
        <TopOfThePile rankings={rankings} />
      </div>

      {playerId && race.length > 0 && (
        <div className="mb-5">
          <AwardRaceCard race={race} />
        </div>
      )}

      <QuickLinks articles={articles} playerId={playerId} newHonours={newHonours} awardsWon={awardsWon} />

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
