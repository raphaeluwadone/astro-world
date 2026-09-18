import { createFileRoute } from '@tanstack/react-router'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const Route = createFileRoute('/_app/profile/')({
  component: OwnProfilePage,
})

function OwnProfilePage() {
  const { player, isLoading } = useCurrentPlayer()
  if (isLoading) return <p className="text-sm text-astro-text-dim">Loading&hellip;</p>
  if (!player) return <p className="text-sm text-astro-text-dim">No profile found.</p>
  return <ProfilePage playerId={player.id} isOwnProfile />
}
