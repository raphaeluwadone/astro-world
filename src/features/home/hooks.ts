import { useQuery } from '@tanstack/react-query'
import { fetchAwardRace, fetchMyCommunityLikes } from './api'

export function useMyCommunityLikes(playerId: string | undefined) {
  return useQuery({
    queryKey: ['my-community-likes', playerId],
    queryFn: () => fetchMyCommunityLikes(playerId!),
    enabled: !!playerId,
    refetchInterval: 30_000,
  })
}

export function useAwardRace(enabled: boolean) {
  return useQuery({ queryKey: ['award-race'], queryFn: fetchAwardRace, enabled, staleTime: 60 * 1000 })
}
