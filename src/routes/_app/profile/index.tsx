import { createFileRoute } from '@tanstack/react-router'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const Route = createFileRoute('/_app/profile/')({
  component: OwnProfilePage,
})

function OwnProfilePage() {
  const { player, isLoading, isError, refetch } = useCurrentPlayer()
  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!player) {
    return <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="No profile found for this account." />
  }
  return <ProfilePage playerId={player.id} isOwnProfile />
}
