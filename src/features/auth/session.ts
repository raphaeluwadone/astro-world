import type { Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'

interface SessionState {
  session: Session | null
  loading: boolean
}

let state: SessionState = { session: null, loading: true }
let onboardedUser: string | null = null
const listeners = new Set<() => void>()

function set(session: Session | null) {
  if (session?.user.id !== state.session?.user.id) onboardedUser = null
  state = { session, loading: false }
  listeners.forEach((l) => l())
}

// One listener for the whole app; components read it through useSession.
supabase.auth.getSession().then(({ data }) => set(data.session))
supabase.auth.onAuthStateChange((_event, session) => set(session))

export function useSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

/** Route guards skip the player lookup once this user is known to be fully set up. */
export function isKnownOnboarded(userId: string) {
  return onboardedUser === userId
}

export function markOnboarded(userId: string) {
  onboardedUser = userId
}
