import { createFileRoute } from '@tanstack/react-router'
import { PlayersPage } from '@/features/players/PlayersPage'

export const Route = createFileRoute('/_app/players/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
  }),
  component: PlayersPage,
})
