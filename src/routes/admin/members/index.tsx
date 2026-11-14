import { createFileRoute } from '@tanstack/react-router'
import { MembersPage, type Filter } from '@/features/admin/members/MembersPage'

const FILTERS: Filter[] = ['active', 'admins', 'writers', 'unclaimed', 'left', 'all']

export const Route = createFileRoute('/admin/members/')({
  validateSearch: (search: Record<string, unknown>): { filter?: Filter } => ({
    filter: FILTERS.includes(search.filter as Filter) ? (search.filter as Filter) : undefined,
  }),
  component: MembersRoute,
})

function MembersRoute() {
  const { filter } = Route.useSearch()
  return <MembersPage initialFilter={filter} />
}
