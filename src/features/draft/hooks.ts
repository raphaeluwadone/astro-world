import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId } from 'react'
import { useNextMatchday } from '@/features/matchday/hooks'
import { supabase } from '@/lib/supabase'
import { cancelDraft, fetchDraft, pickPlayer, publishDraft, startDraft, undoPick } from './api'
import type { DraftState } from './turn'

const key = (matchdayId: string | undefined) => ['draft', matchdayId]

/** The running selection for a matchday, kept live: every pick shows up for everyone as it lands. */
export function useDraft(matchdayId: string | undefined) {
  const qc = useQueryClient()
  const instance = useId()
  useEffect(() => {
    if (!matchdayId) return
    const refresh = () => qc.invalidateQueries({ queryKey: key(matchdayId) })
    // Picks and captains carry no matchday column to filter on, and only one selection runs at a time.
    const channel = supabase
      .channel(`draft:${matchdayId}:${instance}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_sessions' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_captains' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, refresh)
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchdayId, qc, instance])
  return useQuery({ queryKey: key(matchdayId), queryFn: () => fetchDraft(matchdayId!), enabled: !!matchdayId })
}

/** True while captains are picking for the next matchday. The Community goes quiet for as long as it is. */
export function useLiveSelection() {
  const { data: matchday } = useNextMatchday()
  const { data: draft } = useDraft(matchday?.id)
  return { matchdayId: matchday?.id, active: matchday?.status === 'open' && !!draft?.session, draft }
}

function useDraftMutation<T>(matchdayId: string | undefined, fn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: key(matchdayId) }),
  })
}

export function useStartDraft(matchdayId: string) {
  return useDraftMutation(matchdayId, (a: { teamCount: number; captains: string[]; pool: string[] }) => startDraft(matchdayId, a.teamCount, a.captains, a.pool))
}

export function usePickPlayer(matchdayId: string | undefined) {
  return useDraftMutation(matchdayId, (a: { sessionId: string; playerId: string }) => pickPlayer(a.sessionId, a.playerId))
}

export function useUndoPick(matchdayId: string | undefined) {
  return useDraftMutation(matchdayId, (sessionId: string) => undoPick(sessionId))
}

export function useCancelDraft(matchdayId: string | undefined) {
  return useDraftMutation(matchdayId, (sessionId: string) => cancelDraft(sessionId))
}

export function usePublishDraft(matchdayId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (state: DraftState) => publishDraft(matchdayId, state),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key(matchdayId) })
      qc.invalidateQueries({ queryKey: ['matchday', 'next'] })
      qc.invalidateQueries({ queryKey: ['drawn-teams', matchdayId] })
      qc.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}
