import { supabase } from '@/lib/supabase'

export async function signUp({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // Local dev has email confirmations disabled, so a session comes back
  // immediately. A real deployment may require confirming first: in
  // that case there's no session yet, so the Join flow can't start until
  // they confirm and log in (handled by the caller).
  if (!data.session || !data.user) {
    return { confirmationRequired: true as const }
  }

  // No player row is created here anymore: every new account goes
  // through the Join flow (nickname/surname match against the existing
  // roster, claim or create), which is what actually creates or links one.
  return { confirmationRequired: false as const }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** The one number the signed-out landing page can show: everything else
 * on `players` needs a session (players_select_all is `to authenticated`). */
export async function fetchPublicRosterSize(): Promise<number> {
  const { data, error } = await supabase.rpc('public_roster_size')
  if (error) throw error
  return data
}
