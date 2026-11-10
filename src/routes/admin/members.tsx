import { createFileRoute } from '@tanstack/react-router'
import { AdminClaimsPage } from '@/features/admin/AdminClaimsPage'

// TODO: the full roster lands here; until then Members holds the record-claims queue.
export const Route = createFileRoute('/admin/members')({
  component: AdminClaimsPage,
})
