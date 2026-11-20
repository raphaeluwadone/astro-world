import { createFileRoute } from '@tanstack/react-router'
import { TeamCyclePage } from '@/features/admin/TeamCyclePage'

export const Route = createFileRoute('/admin/cycle')({
  component: TeamCyclePage,
})
