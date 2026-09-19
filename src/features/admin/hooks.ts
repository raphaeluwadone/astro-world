import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveClaim, fetchPendingClaims, rejectClaim, type PendingClaimRow } from './api'
import { cancelMatchday, fileMatchdayResults, type FixtureInput } from './results'

export function usePendingClaims() {
  return useQuery({ queryKey: ['pending-claims'], queryFn: fetchPendingClaims })
}

export function useApproveClaim(reviewerPlayerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (claim: PendingClaimRow) => approveClaim(claim, reviewerPlayerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-claims'] }),
  })
}

export function useRejectClaim(reviewerPlayerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (claimId: string) => rejectClaim(claimId, reviewerPlayerId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-claims'] }),
  })
}

export function useFileMatchdayResults(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fixtures: FixtureInput[]) => fileMatchdayResults(matchdayId!, fixtures),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] })
      queryClient.invalidateQueries({ queryKey: ['matchday', 'last-complete'] })
    },
  })
}

export function useCancelMatchday(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelMatchday(matchdayId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] }),
  })
}
