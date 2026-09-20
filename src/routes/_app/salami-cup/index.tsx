import { createFileRoute } from '@tanstack/react-router'
import { SalamiCupPage } from '@/features/salami-cup/SalamiCupPage'

export const Route = createFileRoute('/_app/salami-cup/')({
  component: SalamiCupPage,
})
