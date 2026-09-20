import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

const TABS = [
  { to: '/admin', label: 'Claims' },
  { to: '/admin/matchday', label: 'Matchday' },
  { to: '/admin/results', label: 'Results' },
  { to: '/admin/cup', label: 'Salami Cup' },
  { to: '/admin/kitty', label: 'Kitty' },
] as const

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
  component: () => (
    <div>
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: true }}
            className="rounded-lg border border-border bg-astro-surface-2 px-3.5 py-2 text-xs font-bold text-astro-text-muted no-underline"
            activeProps={{ className: 'rounded-lg bg-astro-accent px-3.5 py-2 text-xs font-extrabold text-astro-on-accent no-underline' }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  ),
})
