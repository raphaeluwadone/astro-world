import { createFileRoute } from '@tanstack/react-router'
import { WelcomePage } from '@/features/auth/WelcomePage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    view: search.view === 'signin' ? ('signin' as const) : undefined,
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, view } = Route.useSearch()
  return <WelcomePage redirectTo={redirect} initialView={view} />
}
