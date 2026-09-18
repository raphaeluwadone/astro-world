import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markOnboarded } from './api'

export function useMarkOnboarded(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markOnboarded(playerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-player'] }),
  })
}
