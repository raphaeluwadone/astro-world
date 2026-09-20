import { createFileRoute } from '@tanstack/react-router'
import { KittyAdminPage } from '@/features/admin/KittyAdminPage'

export const Route = createFileRoute('/_app/admin/kitty')({
  component: KittyAdminPage,
})
