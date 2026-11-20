import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import * as api from './api'

const key = (matchdayId: string | undefined) => ['pitch', matchdayId]

export function usePitch(matchdayId: string | undefined) {
  const qc = useQueryClient()
  const instance = useId()
  useEffect(() => {
    if (!matchdayId) return
    const refresh = () => qc.invalidateQueries({ queryKey: key(matchdayId) })
    // Full time posts a match report, so the feed refreshes with the game.
    const refreshGames = () => {
      refresh()
      void qc.invalidateQueries({ queryKey: ['community-feed'] })
    }
    // pitch_goals and pitch_cards have no matchday column to filter on, so any goal change refreshes; there's only one live matchday.
    const channel = supabase
      .channel(`pitch:${matchdayId}:${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_checkins', filter: `matchday_id=eq.${matchdayId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_games', filter: `matchday_id=eq.${matchdayId}` }, refreshGames)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_goals' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_cards' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_sessions', filter: `matchday_id=eq.${matchdayId}` }, refresh)
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchdayId, qc, instance])
  return useQuery({ queryKey: key(matchdayId), queryFn: () => api.fetchPitch(matchdayId!), enabled: !!matchdayId })
}

/** Every pitch-side write: runs the call, then refetches the matchday's pitch state. */
export function usePitchAction(matchdayId: string | undefined) {
  const qc = useQueryClient()
  const { player } = useCurrentPlayer()
  return useMutation({
    mutationFn: (run: (by: string) => Promise<unknown>) => run(player!.id),
    onSettled: () => qc.invalidateQueries({ queryKey: key(matchdayId) }),
  })
}
