import { createFileRoute } from '@tanstack/react-router'
import { MatchdayPage } from '@/features/matchday/MatchdayPage'

export const Route = createFileRoute('/_app/matchday/')({
  component: MatchdayPage,
})
