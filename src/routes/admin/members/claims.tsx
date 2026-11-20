import { createFileRoute } from '@tanstack/react-router'
import { AdminClaimsPage } from '@/features/admin/AdminClaimsPage'

export const Route = createFileRoute('/admin/members/claims')({
  component: AdminClaimsPage,
})
