import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addSelfTag, removeSelfTag, searchClubs, updatePlayer, type EditablePlayerFields } from './api'

export function useSearchClubs(query: string) {
  return useQuery({
    queryKey: ['pro-clubs-search', query],
    queryFn: () => searchClubs(query),
    enabled: query.trim().length >= 2,
  })
}

export function useUpdatePlayer(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fields: EditablePlayerFields) => updatePlayer(playerId!, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] })
      queryClient.invalidateQueries({ queryKey: ['current-player'] })
    },
  })
}

export function useAddSelfTag(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tagId: string) => addSelfTag(playerId!, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-tags', playerId] }),
  })
}

export function useRemoveSelfTag(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (playerTagRowId: string) => removeSelfTag(playerTagRowId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-tags', playerId] }),
  })
}
