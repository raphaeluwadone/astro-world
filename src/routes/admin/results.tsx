import { createFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '@/features/admin/ResultsPage'

export const Route = createFileRoute('/admin/results')({
  component: ResultsPage,
})
