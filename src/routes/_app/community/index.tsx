import { createFileRoute } from '@tanstack/react-router'
import { CommunityPage } from '@/features/community/CommunityPage'

export const Route = createFileRoute('/_app/community/')({
  component: CommunityPage,
})
