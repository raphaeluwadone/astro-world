import { createFileRoute } from '@tanstack/react-router'
import { ScheduleMatchdayPage } from '@/features/admin/ScheduleMatchdayPage'

export const Route = createFileRoute('/_app/admin/matchday')({
  component: ScheduleMatchdayPage,
})
