import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

// Every /admin/* route nests under here, so this single guard covers all
// of them as the section grows, no per-page admin check needed.
export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login' })
    }

    const { data: player } = await supabase
      .from('players')
      .select('is_admin')
      .eq('user_id', data.session.user.id)
      .maybeSingle()

    if (!player?.is_admin) {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
