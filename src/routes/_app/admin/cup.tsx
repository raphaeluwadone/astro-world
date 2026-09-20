import { createFileRoute } from '@tanstack/react-router'
import { CupAdminPage } from '@/features/admin/CupAdminPage'

export const Route = createFileRoute('/_app/admin/cup')({
  component: CupAdminPage,
})
