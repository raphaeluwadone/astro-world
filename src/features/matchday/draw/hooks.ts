import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { previewTeamDraw, publishTeamDraw } from './api'
import type { DrawRules } from './rules'
import { addNeverPair, fetchDrawRules, fetchNeverPairs, removeNeverPair, saveDrawRules, type NeverPair } from './settings'

export function usePreviewTeamDraw(matchdayId: string | undefined) {
  return useMutation({ mutationFn: (rules: DrawRules) => previewTeamDraw(matchdayId!, rules) })
}

export function usePublishTeamDraw(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teams: string[][]) => publishTeamDraw(matchdayId!, teams),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] })
      queryClient.invalidateQueries({ queryKey: ['drawn-teams', matchdayId] })
      queryClient.invalidateQueries({ queryKey: ['ballot-entries', matchdayId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}

export function useDrawRules() {
  return useQuery({ queryKey: ['draw-rules'], queryFn: fetchDrawRules })
}

export function useSaveDrawRules() {
  const queryClient = useQueryClient()
  const { player } = useCurrentPlayer()
  return useMutation({
    mutationFn: (rules: DrawRules) => saveDrawRules(rules, player?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['draw-rules'] }),
  })
}

export function useNeverPairs() {
  return useQuery({ queryKey: ['never-pairs'], queryFn: fetchNeverPairs })
}

export function useNeverPairActions() {
  const queryClient = useQueryClient()
  const { player } = useCurrentPlayer()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['never-pairs'] })
  return {
    add: useMutation({ mutationFn: ([a, b]: [string, string]) => addNeverPair(a, b, player?.id), onSuccess }),
    remove: useMutation({ mutationFn: (pair: NeverPair) => removeNeverPair(pair), onSuccess }),
  }
}
