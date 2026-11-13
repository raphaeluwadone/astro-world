import { createFileRoute } from '@tanstack/react-router'
import { PaymentsAdminPage } from '@/features/admin/PaymentsAdminPage'

export const Route = createFileRoute('/admin/payments')({
  component: PaymentsAdminPage,
})
