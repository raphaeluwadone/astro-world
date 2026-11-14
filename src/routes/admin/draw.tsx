import { createFileRoute } from '@tanstack/react-router'
import { DrawRulesPage } from '@/features/admin/DrawRulesPage'

export const Route = createFileRoute('/admin/draw')({
  component: DrawRulesPage,
})
