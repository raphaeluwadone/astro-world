import { useQuery } from '@tanstack/react-query'
import { fetchAwardRace, fetchMyCommunityLikes, fetchPendingRatings } from './api'

export function useMyCommunityLikes(playerId: string | undefined) {
  return useQuery({
    queryKey: ['my-community-likes', playerId],
    queryFn: () => fetchMyCommunityLikes(playerId!),
    enabled: !!playerId,
    refetchInterval: 30_000,
  })
}

export function usePendingRatings(playerId: string | undefined, matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['pending-ratings', playerId, matchdayId],
    queryFn: () => fetchPendingRatings(playerId!, matchdayId!),
    enabled: !!playerId && !!matchdayId,
  })
}

export function useAwardRace(enabled: boolean) {
  return useQuery({ queryKey: ['award-race'], queryFn: fetchAwardRace, enabled, staleTime: 60 * 1000 })
}
