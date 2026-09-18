import { createFileRoute } from '@tanstack/react-router'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { OutOfPlayIcon } from '@/components/states/icons'
import { PageLoader } from '@/components/states/PageLoader'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const Route = createFileRoute('/_app/profile/')({
  component: OwnProfilePage,
})

function OwnProfilePage() {
  const { player, isLoading } = useCurrentPlayer()
  if (isLoading) return <PageLoader />
  if (!player) {
    return <EmptyState icon={<OutOfPlayIcon />} title="Nobody fits that." body="No profile found for this account." />
  }
  return <ProfilePage playerId={player.id} isOwnProfile />
}
