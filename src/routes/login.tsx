import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { WelcomePage } from '@/features/auth/WelcomePage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; view?: 'signin' } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    view: search.view === 'signin' ? ('signin' as const) : undefined,
  }),
  // Already signed in: go where they were heading instead of showing the landing page.
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession()
    if (data.session) throw redirect({ to: search.redirect ?? '/' })
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, view } = Route.useSearch()
  return <WelcomePage redirectTo={redirect} initialView={view} />
}
