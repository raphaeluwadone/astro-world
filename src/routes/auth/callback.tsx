import { createFileRoute } from '@tanstack/react-router'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : undefined,
  }),
  component: CallbackRoute,
})

function CallbackRoute() {
  const { redirect } = Route.useSearch()
  return <AuthCallbackPage redirect={redirect} />
}
