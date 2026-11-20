import { createFileRoute } from '@tanstack/react-router'
import { GUIDE_CHAPTERS, type ChapterId } from '@/features/guide/chapters'
import { GuidePage } from '@/features/guide/GuidePage'

const IDS = new Set<string>(GUIDE_CHAPTERS.map((c) => c.id))

export const Route = createFileRoute('/_app/guide/')({
  validateSearch: (search: Record<string, unknown>): { c?: ChapterId } => ({
    c: typeof search.c === 'string' && IDS.has(search.c) ? (search.c as ChapterId) : undefined,
  }),
  component: function GuideRoute() {
    const { c } = Route.useSearch()
    return <GuidePage chapter={c} />
  },
})
