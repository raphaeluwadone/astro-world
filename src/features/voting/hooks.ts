import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMyMatchToRate, fetchMyScores, fetchRatingsOpen, fetchRoster, upsertRating } from './api'

export function useMyMatchToRate(playerId: string | undefined) {
  return useQuery({
    queryKey: ['voting-match', playerId],
    queryFn: () => fetchMyMatchToRate(playerId!),
    enabled: !!playerId,
  })
}

export function useRatingsOpen(matchId: string | undefined) {
  return useQuery({
    queryKey: ['voting-open', matchId],
    queryFn: () => fetchRatingsOpen(matchId!),
    enabled: !!matchId,
  })
}

export function useRoster(matchId: string | undefined) {
  return useQuery({
    queryKey: ['voting-roster', matchId],
    queryFn: () => fetchRoster(matchId!),
    enabled: !!matchId,
  })
}

export function useMyScores(matchId: string | undefined) {
  return useQuery({
    queryKey: ['voting-my-scores', matchId],
    queryFn: () => fetchMyScores(matchId!),
    enabled: !!matchId,
  })
}

export function useSubmitRating(matchId: string | undefined, raterId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, score }: { subjectId: string; score: number }) =>
      upsertRating(matchId!, raterId!, subjectId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting-my-scores', matchId] })
    },
  })
}
