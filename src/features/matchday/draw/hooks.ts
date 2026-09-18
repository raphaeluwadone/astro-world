import { useMutation, useQueryClient } from '@tanstack/react-query'
import { runTeamDraw } from './api'

export function useRunTeamDraw(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runTeamDraw(matchdayId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] })
      queryClient.invalidateQueries({ queryKey: ['drawn-teams', matchdayId] })
      queryClient.invalidateQueries({ queryKey: ['ballot-entries', matchdayId] })
    },
  })
}
