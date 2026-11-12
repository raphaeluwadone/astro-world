import { Link } from '@tanstack/react-router'
import { BadgeCabinet, BadgeRail, holdsCup, NewBadgeBanner } from '@/features/badges/components/ProfileBadges'
import { usePlayerBadges } from '@/features/badges/hooks'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { PhotoControls } from '@/features/photos/PhotoControls'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { Comparisons } from './components/Comparisons'
import { HeroCard } from './components/HeroCard'
import { InfoPanel } from './components/InfoPanel'
import { MatchHistoryList } from './components/MatchHistoryList'
import { RecentForm } from './components/RecentForm'
import { StatsSection } from './components/StatsSection'
import {
  useCareerStats,
  useComparisons,
  useMatchHistory,
  useMatchRatings,
  usePlayer,
  usePlayerTags,
} from './hooks'

function average(nums: number[]) {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

export function ProfilePage({ playerId, isOwnProfile }: { playerId: string; isOwnProfile: boolean }) {
  const { player: currentPlayer } = useCurrentPlayer()
  const { data: player, isLoading, isError, refetch } = usePlayer(playerId)
  const { data: matchRatings = [] } = useMatchRatings(playerId)
  const { data: matchHistory = [] } = useMatchHistory(playerId)
  const { data: careerStats } = useCareerStats(playerId)
  const { data: tags = [] } = usePlayerTags(playerId)
  const { data: comparisons = [] } = useComparisons(playerId, currentPlayer?.id)
  const badges = usePlayerBadges(playerId)

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!player) {
    return <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="This player doesn't exist, or the link's wrong." />
  }

  const careerAvg = average(matchRatings.map((r) => r.avg_rating))

  // Same "legacy baseline + real in-app total" combination player_career_stats()
  // already does for Rankings/Players: without it, career here would silently
  // disagree with those screens for every one of the 70 imported players, the
  // exact "two different totals for the same career" bug the real almanac
  // this data came from was caught making.
  const combinedCareerStats = careerStats && {
    appearances: careerStats.appearances + player.legacy_appearances,
    goals: careerStats.goals + player.legacy_goals,
    assists: careerStats.assists + player.legacy_assists,
    motm: careerStats.motm,
    ownGoals: careerStats.ownGoals,
    yellows: careerStats.yellows + player.legacy_yellow_cards,
    reds: careerStats.reds + player.legacy_red_cards,
  }

  return (
    <div className="space-y-5">
      <NewBadgeBanner badges={badges} nickname={player.nickname} />
      <div className="mb-1 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
            Player profile
          </div>
          <h1 className="font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
            {player.nickname.toUpperCase()}
          </h1>
          <div className="mt-1 text-sm text-astro-text-muted">{player.full_name}</div>
          <BadgeRail badges={badges} />
        </div>
        {isOwnProfile && (
          <Link
            to="/profile/edit"
            className="flex items-center gap-2 rounded-[11px] border border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-[18px] py-3 text-[13px] font-extrabold text-astro-accent-soft hover:bg-astro-accent/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.8 17.4 14.9 5.3l3.8 3.8L6.6 21.2H2.8ZM16.2 4 17.9 2.3l3.8 3.8L20 7.8Z" />
            </svg>
            Edit profile
          </Link>
        )}
        {!isOwnProfile && currentPlayer && (
          <Link
            to="/compare"
            search={{ ids: `${currentPlayer.id},${player.id}` }}
            className="rounded-[11px] border border-[rgba(166,63,255,0.4)] bg-astro-surface-2 px-[18px] py-3 text-[13px] font-extrabold text-astro-accent-soft hover:bg-astro-accent/10"
          >
            Compare with me
          </Link>
        )}
        {!isOwnProfile && currentPlayer?.is_admin && (
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-astro-cyan">Admin · card photo</span>
            <PhotoControls playerId={player.id} size="sm" />
          </div>
        )}
      </div>

      <div className="grid items-start gap-5.5 lg:grid-cols-[320px_1fr]">
        <HeroCard player={player} careerAvg={careerAvg} tags={tags} badges={badges} cupWinner={holdsCup(badges)} />
        <InfoPanel player={player} />
      </div>

      <BadgeCabinet badges={badges} nickname={player.nickname} />

      {combinedCareerStats && <StatsSection matchRatings={matchRatings} careerStats={combinedCareerStats} />}

      <div className="grid gap-5 xl:grid-cols-2">
        <RecentForm matchRatings={matchRatings} compact showStats />
        <MatchHistoryList history={matchHistory} />
      </div>

      <Comparisons
        comparisons={comparisons}
        playerId={playerId}
        subjectNickname={player.nickname}
        isOwnProfile={isOwnProfile}
        currentPlayerId={currentPlayer?.id}
      />
    </div>
  )
}
