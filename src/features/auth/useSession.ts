import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** The raw Supabase Auth session — null whenever the visitor is signed out. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

/**
 * The signed-in user's own `players` row, or null if signed out / no row
 * yet. Uses maybeSingle (not single) because "a valid session with zero
 * matching player rows" is a real state, not an error — e.g. locally,
 * resetting the database wipes auth.users, but a browser tab that was
 * already signed in keeps a JWT that still verifies (the local JWT
 * secret doesn't change on reset), so `auth.uid()` resolves to a user
 * that no longer has a players row. When that happens, sign the stale
 * session out — never leave it sitting in a broken logged-in-but-no-
 * profile limbo.
 */
export function useCurrentPlayer() {
  const { session, loading: sessionLoading } = useSession()
  const userId = session?.user.id
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['current-player', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (query.isSuccess && query.data === null) {
      supabase.auth.signOut().then(() => navigate({ to: '/login' }))
    }
  }, [query.isSuccess, query.data, navigate])

  return {
    player: query.data ?? null,
    isLoading: sessionLoading || (!!userId && query.isLoading),
    isError: query.isError,
    refetch: query.refetch,
  }
}
