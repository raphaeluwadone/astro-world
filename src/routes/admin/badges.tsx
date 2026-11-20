import { createFileRoute } from '@tanstack/react-router'
import { BadgesAdminPage } from '@/features/admin/BadgesAdminPage'

export const Route = createFileRoute('/admin/badges')({
  component: BadgesAdminPage,
})
