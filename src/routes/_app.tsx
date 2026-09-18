import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app')({
  // Ask Supabase directly rather than trusting router context: it reads
  // the persisted session (localStorage) and refreshes it if needed, so
  // this is correct regardless of React's render timing, no race with
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

    if (!player) {
      // Signed in, but the Join flow never linked (or finished linking) a
      // player row yet: any existing claim, pending or rejected, sends them
      // to the holding page instead of asking them to submit it again. An
      // approved claim already has a player row by now, so it never lands
      // here.
      const { data: claim } = await supabase
        .from('player_claims')
        .select('status')
        .eq('claimant_user_id', data.session.user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (claim) {
        throw redirect({ to: '/pending-approval' })
      }
      throw redirect({ to: '/join' })
    }

    if (player.onboarded_at === null) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
