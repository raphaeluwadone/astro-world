import { createFileRoute } from '@tanstack/react-router'
import { ComparePage, type CompareSearch, type CompareView } from '@/features/compare/ComparePage'
import type { CompareScope } from '@/features/compare/api'

const VIEWS: CompareView[] = ['duel', 'field', 'radar', 'table']
const SCOPES: CompareScope[] = ['season', 'career', 'cup']

export const Route = createFileRoute('/_app/compare/')({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    ids: typeof search.ids === 'string' && search.ids ? search.ids : undefined,
    view: VIEWS.includes(search.view as CompareView) ? (search.view as CompareView) : undefined,
    scope: SCOPES.includes(search.scope as CompareScope) ? (search.scope as CompareScope) : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <ComparePage search={Route.useSearch()} />
}
