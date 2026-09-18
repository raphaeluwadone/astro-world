import { createFileRoute } from '@tanstack/react-router'
import { MatchPage } from '@/features/match/MatchPage'

export const Route = createFileRoute('/_app/matchday/$matchId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { matchId } = Route.useParams()
  return <MatchPage matchId={matchId} />
}
