import { createFileRoute } from '@tanstack/react-router'
import { MembersPage } from '@/features/admin/members/MembersPage'

export const Route = createFileRoute('/admin/members/')({
  component: MembersPage,
})
