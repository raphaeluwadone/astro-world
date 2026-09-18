import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app')({
  // Ask Supabase directly rather than trusting router context: it reads
  // the persisted session (localStorage) and refreshes it if needed, so
  // this is correct regardless of React's render timing — no race with
  // app-level session-loading state.
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    const { data: player } = await supabase
      .from('players')
      .select('onboarded_at')
      .eq('user_id', data.session.user.id)
      .maybeSingle()
    if (player && player.onboarded_at === null) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
