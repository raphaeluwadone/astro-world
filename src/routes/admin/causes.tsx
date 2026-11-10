import { createFileRoute } from '@tanstack/react-router'
import { CausesAdminPage } from '@/features/admin/KittyAdminPage'

export const Route = createFileRoute('/admin/causes')({
  component: CausesAdminPage,
})
