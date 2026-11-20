import { createFileRoute } from '@tanstack/react-router'
import { HonoursPage, type HonoursView } from '@/features/honours/HonoursPage'

const VIEWS: HonoursView[] = ['latest', 'roll', 'history']

export const Route = createFileRoute('/_app/honours/')({
  validateSearch: (search: Record<string, unknown>): { view?: HonoursView; year?: number } => ({
    view: VIEWS.includes(search.view as HonoursView) ? (search.view as HonoursView) : undefined,
    year: Number.isInteger(Number(search.year)) && search.year != null ? Number(search.year) : undefined,
  }),
  component: function HonoursRoute() {
    const { view, year } = Route.useSearch()
    return <HonoursPage view={view} year={year} />
  },
})
