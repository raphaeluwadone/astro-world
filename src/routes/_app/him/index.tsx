import { createFileRoute } from '@tanstack/react-router'
import { HimBoardPage } from '@/features/him/HimBoardPage'

export const Route = createFileRoute('/_app/him/')({
  component: HimBoardPage,
})
