import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import { fetchEmailPrefs, fetchNotifications, markNotificationsRead, saveEmailPrefs, type EmailPrefs, type NotificationRow } from './api'

const KEY = ['notifications']

export function useNotifications() {
  const { session } = useSession()
  return useQuery({ queryKey: KEY, queryFn: () => fetchNotifications(), enabled: !!session, staleTime: 60_000 })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  return data?.filter((n) => !n.read_at).length ?? 0
}

/** Keeps the inbox live. Mount once, in the app shell. */
export function useNotificationsRealtime() {
  const { session } = useSession()
  const qc = useQueryClient()
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () =>
        qc.invalidateQueries({ queryKey: KEY }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, qc])
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[] | null) => markNotificationsRead(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: KEY })
      const now = new Date().toISOString()
      qc.setQueryData<NotificationRow[]>(KEY, (rows) =>
        rows?.map((n) => (!n.read_at && (!ids || ids.includes(n.id)) ? { ...n, read_at: now } : n)),
      )
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEmailPrefs() {
  const { session } = useSession()
  const userId = session?.user.id
  return useQuery({ queryKey: ['email-prefs', userId], queryFn: () => fetchEmailPrefs(userId!), enabled: !!userId })
}

export function useSaveEmailPrefs() {
  const { session } = useSession()
  const qc = useQueryClient()
  const userId = session?.user.id
  return useMutation({
    mutationFn: (prefs: EmailPrefs) => saveEmailPrefs(userId!, prefs),
    onMutate: (prefs) => qc.setQueryData(['email-prefs', userId], prefs),
    onSettled: () => qc.invalidateQueries({ queryKey: ['email-prefs', userId] }),
  })
}
