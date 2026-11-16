import { createFileRoute, redirect } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { DevSignInAs } from '@/features/auth/dev'
import { supabase } from '@/lib/supabase'
import { LEFT_NOTICE, WelcomePage } from '@/features/auth/WelcomePage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; view?: 'signin'; left?: boolean } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    view: search.view === 'signin' ? ('signin' as const) : undefined,
    left: search.left === true || search.left === 'true' ? true : undefined,
  }),
  // Already signed in: go where they were heading instead of showing the landing page.
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession()
    if (data.session) throw redirect({ to: search.redirect ?? '/' })
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, left } = Route.useSearch()
  const [real, setReal] = useState(false)
  if (DevSignInAs && !real && !left) {
    return (
      <div className="grid min-h-screen place-items-center bg-astro-bg p-4">
        <Suspense fallback={null}>
          <DevSignInAs redirectTo={redirect} onRealSignIn={() => setReal(true)} />
        </Suspense>
      </div>
    )
  }
  return <WelcomePage redirectTo={redirect} notice={left ? LEFT_NOTICE : undefined} />
}
