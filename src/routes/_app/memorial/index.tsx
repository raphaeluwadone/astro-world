import { createFileRoute } from '@tanstack/react-router'
import { MemorialPage } from '@/features/memorial/MemorialPage'

export const Route = createFileRoute('/_app/memorial/')({
  component: MemorialPage,
})
