import { createFileRoute } from '@tanstack/react-router'
import { VotingPage } from '@/features/voting/VotingPage'

export const Route = createFileRoute('/_app/matchday/voting')({
  component: VotingPage,
})
