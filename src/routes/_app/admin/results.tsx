import { createFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '@/features/admin/ResultsPage'

export const Route = createFileRoute('/_app/admin/results')({
  component: ResultsPage,
})
