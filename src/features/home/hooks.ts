import { useQuery } from '@tanstack/react-query'
import { fetchMyCommunityLikes, fetchPendingRatings } from './api'

export function useMyCommunityLikes(playerId: string | undefined) {
  return useQuery({
    queryKey: ['my-community-likes', playerId],
    queryFn: () => fetchMyCommunityLikes(playerId!),
    enabled: !!playerId,
  })
}

export function usePendingRatings(playerId: string | undefined, matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['pending-ratings', playerId, matchdayId],
    queryFn: () => fetchPendingRatings(playerId!, matchdayId!),
    enabled: !!playerId && !!matchdayId,
  })
}
