import { createFileRoute } from '@tanstack/react-router'
import { DuesAdminPage } from '@/features/admin/KittyAdminPage'

export const Route = createFileRoute('/admin/dues')({
  component: DuesAdminPage,
})
