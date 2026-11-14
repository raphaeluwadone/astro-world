import { TimedNotice } from '@/components/TimedNotice'
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
import { LiveMatchday } from '@/features/matchday/components/LiveMatchday'
import { CupTableCard } from '@/features/salami-cup/components/CupTableCard'
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
import { HomeNotices } from './components/HomeNotices'
import { LastResultCard } from './components/LastResultCard'
import { honourNoticeId, LatestHonour, recentHonour } from './components/LatestHonour'
import { isRuleChangeRecent, RULES_NOTICE_ID, RulesChangedStrip } from './components/RulesChangedStrip'
import { ArticlesPreview } from './components/ArticlesPreview'
import { GroupChatPreview } from './components/GroupChatPreview'
import { NextMatchdayCard } from './components/NextMatchdayCard'
import { QuickLinks } from './components/QuickLinks'
import { RatingsBanner } from '@/features/voting/components/RatingsPrompt'
import { TopOfThePile } from './components/TopOfThePile'
import { HeartCount } from './components/HeartCount'
import { useAwardRace, useMyCommunityLikes } from './hooks'

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
  const { data: likes, isSuccess: likesLoaded } = useMyCommunityLikes(playerId ?? undefined)
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
    // On phones the top grid dissolves (display: contents) so every card can be ordered on its own.
    <div className="@container flex flex-col gap-5">
      <div className="mb-1.5 flex items-start justify-between gap-3 md:flex-wrap md:items-end md:gap-4 max-md:order-1">
        <div className="min-w-0">
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
        <HeartCount count={likesLoaded ? likes : undefined} playerId={playerId ?? undefined} />
      </div>

      <PlayerSearchBar className="md:hidden max-md:order-2" />
      <LiveMatchday className="max-md:order-2" />

      <div className="md:hidden max-md:order-5">
        <HomeNotices honour={latestHonour} cup={shouldShowCupBanner(cup) ? cup : null} rulesChanged={isRuleChangeRecent()} />
      </div>
      {isRuleChangeRecent() && (
        <TimedNotice id={RULES_NOTICE_ID} className="rounded-[14px] max-md:hidden">
          <RulesChangedStrip />
        </TimedNotice>
      )}
      {latestHonour && (
        <TimedNotice id={honourNoticeId(latestHonour)} className="rounded-[14px] max-md:hidden">
          <LatestHonour item={latestHonour} />
        </TimedNotice>
      )}
      {shouldShowCupBanner(cup) && (
        <div className="max-md:hidden">
          <CupBanner cup={cup} />
        </div>
      )}

      <RatingsBanner className="max-md:order-4" />

      <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-2 @[78rem]:grid-cols-4 max-md:contents">
        <CupTableCard className="astro-card p-4 max-md:order-3" />
        {!matchdayLoading && matchday && (
          <div className="max-md:order-3">
            <NextMatchdayCard
              matchday={matchday}
              monthlyInCount={monthlyMembers.filter((m) => !optedOut.has(m.player_id)).length}
              weeklyCount={weeklyClaims.length}
              standbyCount={standby.length}
              spotsRemaining={spotsRemaining}
              playerId={playerId}
              me={me}
            />
          </div>
        )}
        {lastComplete && (
          <div className="max-md:order-6">
            <LastResultCard matchdayId={lastComplete.id} playedAt={lastComplete.played_at} />
          </div>
        )}
        <div className="max-md:order-7">
          <RecentForm matchRatings={matchRatings} title="Your Recent Form" titleSize={26} summary={formSummary(matchRatings)} compact />
        </div>
        <div className="max-md:order-8">
          <TopOfThePile rankings={rankings} />
        </div>
      </div>

      {playerId && race.length > 0 && (
        <div className="max-md:order-9">
          <AwardRaceCard race={race} />
        </div>
      )}

      <div className="md:hidden max-md:order-10">
        <QuickLinks articles={articles} playerId={playerId} newHonours={newHonours} awardsWon={awardsWon} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-2 max-md:order-11">
        <GroupChatPreview posts={feed} />
        <ArticlesPreview articles={articles} />
      </div>
    </div>
  )
}
