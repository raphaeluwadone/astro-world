import { supabase } from '@/lib/supabase'

export async function signUp({
  email,
  password,
  nickname,
  fullName,
}: {
  email: string
  password: string
  nickname: string
  fullName: string
}) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // Local dev has email confirmations disabled, so a session comes back
  // immediately. A real deployment may require confirming first — in
  // that case there's no session yet, so the player row can't be
  // created until they confirm and log in (handled by the caller).
  if (!data.session || !data.user) {
    return { confirmationRequired: true as const }
  }

  const { error: playerError } = await supabase
    .from('players')
    .insert({ user_id: data.user.id, nickname, full_name: fullName })
  if (playerError) throw playerError

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
