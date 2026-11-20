import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type NotificationRow = Database['public']['Tables']['notifications']['Row'] & {
  actor: { nickname: string } | null
}

export type EmailPrefs = Pick<Database['public']['Tables']['notification_prefs']['Row'], 'email_badges' | 'email_dues' | 'email_matchday'>

export const NO_EMAILS: EmailPrefs = { email_badges: false, email_dues: false, email_matchday: false }

export async function fetchNotifications(limit = 60): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:players!notifications_actor_id_fkey(nickname)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as NotificationRow[]
}

export async function markNotificationsRead(ids: string[] | null) {
  const { error } = await supabase.rpc('mark_notifications_read', { p_ids: ids ?? undefined })
  if (error) throw error
}

export async function fetchEmailPrefs(userId: string): Promise<EmailPrefs> {
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('email_badges, email_dues, email_matchday')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? NO_EMAILS
}

export async function saveEmailPrefs(userId: string, prefs: EmailPrefs) {
  const { error } = await supabase.from('notification_prefs').upsert({ user_id: userId, ...prefs })
  if (error) throw error
}
