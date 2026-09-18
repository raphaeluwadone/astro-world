import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/PagePlaceholder'

export const Route = createFileRoute('/_app/admin/')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <PagePlaceholder
      eyebrow="A separate application, on purpose"
      title="Admin Portal"
      description="Designed as its own product (near-black chrome, cyan as the action colour, no card motif, no motion) so it's always obvious which app you're in. Not built yet: matchday-day live adjustments (no-shows, replacements, swaps) are the highest-priority screen once this starts."
    />
  )
}
