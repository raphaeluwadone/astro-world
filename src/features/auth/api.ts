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

/** Where email links and Google send people back to; the callback page finishes sign-in. */
function callbackUrl(redirect?: string) {
  return `${window.location.origin}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`
}

export async function sendResetLink(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

/** One email with a 6-digit code and a link. `createUser` is false on sign-in so a typo can't open a new account. */
export async function sendEmailCode(email: string, { createUser, redirect }: { createUser: boolean; redirect?: string }) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: createUser, emailRedirectTo: callbackUrl(redirect) } })
  if (error) throw error
}

export async function verifyEmailCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

export async function signInWithGoogle(redirect?: string) {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl(redirect) } })
  if (error) throw error
}

export const GOOGLE_ENABLED = import.meta.env.VITE_AUTH_GOOGLE === 'true'

/** Supabase's messages are written for developers; these are the ones players actually hit. */
export function authMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ''
  if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match.'
  if (/signups not allowed for otp|user not found/i.test(msg)) return 'There’s no account with that email. Go back and choose “I’m new here”.'
  if (/expired|invalid/i.test(msg) && /token|otp|code/i.test(msg)) return 'That code is wrong or has expired.'
  if (/rate limit|security purposes|too many/i.test(msg)) return 'Too many tries. Wait a minute and try again.'
  if (/already registered/i.test(msg)) return 'That email already has an account. Sign in instead.'
  if (/should be different/i.test(msg)) return 'Pick a password you haven’t used here before.'
  if (/provider is not enabled/i.test(msg)) return 'Google sign-in isn’t switched on yet.'
  return msg || 'Something went wrong. Try again.'
}
