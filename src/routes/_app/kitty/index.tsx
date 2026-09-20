import { createFileRoute } from '@tanstack/react-router'
import { KittyPage } from '@/features/kitty/KittyPage'

export const Route = createFileRoute('/_app/kitty/')({
  component: KittyPage,
})
