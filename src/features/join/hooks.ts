import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchFreeNames, fetchMyLatestClaim, joinGroup, type JoinInput } from './api'

export function useFreeNames() {
  return useQuery({ queryKey: ['free-names'], queryFn: fetchFreeNames })
}

export function useJoinGroup() {
  return useMutation({ mutationFn: (input: JoinInput) => joinGroup(input) })
}

export function useMyLatestClaim(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-latest-claim', userId],
    queryFn: () => fetchMyLatestClaim(userId!),
    enabled: !!userId,
  })
}
