import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AdminShell } from '@/features/admin/shell/AdminShell'
import { supabase } from '@/lib/supabase'

// Lives outside `_app` so the portal gets its own chrome instead of the member shell.
// This guard covers every /admin/* route.
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
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
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
})
