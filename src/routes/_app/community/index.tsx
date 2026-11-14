import { createFileRoute } from '@tanstack/react-router'
import { CommunityPage } from '@/features/community/CommunityPage'

export const Route = createFileRoute('/_app/community/')({
  validateSearch: (search: Record<string, unknown>): { post?: string } =>
    typeof search.post === 'string' ? { post: search.post } : {},
  component: CommunityPage,
})
