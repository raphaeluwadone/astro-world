import { createFileRoute } from '@tanstack/react-router'
import { AwardsPage } from '@/features/badges/AwardsPage'

export const Route = createFileRoute('/_app/awards/')({
  component: AwardsPage,
})
