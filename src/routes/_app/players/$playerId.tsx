import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/profile/ProfilePage'

export const Route = createFileRoute('/_app/players/$playerId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { playerId } = Route.useParams()
  return <ProfilePage playerId={playerId} isOwnProfile={false} />
}
