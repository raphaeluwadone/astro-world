import { createFileRoute } from '@tanstack/react-router'
import { PitchSidePage } from '@/features/admin/pitch/PitchSidePage'

export const Route = createFileRoute('/admin/pitch')({
  component: PitchSidePage,
})
