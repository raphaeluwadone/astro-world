import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyScores,
  fetchRatingMatchday,
  fetchRatingsOpenToEveryone,
  fetchRoster,
  ratePlayer,
  setRatingsOpenToEveryone,
} from './api'

export function useRatingMatchday(playerId: string | undefined) {
  return useQuery({ queryKey: ['rating-matchday', playerId], queryFn: fetchRatingMatchday, enabled: !!playerId })
}

export function useRoster(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['voting-roster', matchdayId],
    queryFn: () => fetchRoster(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useMyScores(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['voting-my-scores', matchdayId],
    queryFn: () => fetchMyScores(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useSubmitRating(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, score }: { subjectId: string; score: number }) => ratePlayer(matchdayId!, subjectId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting-my-scores', matchdayId] })
    },
  })
}

/** How many players the signed-in player can still rate. Null when there's nothing for them to do. */
export function usePendingRatings(playerId: string | undefined) {
  const { data: matchday } = useRatingMatchday(playerId)
  const live = matchday?.canRate ? matchday.matchdayId : undefined
  const { data: roster } = useRoster(live)
  const { data: scores } = useMyScores(live)
  if (!matchday?.canRate || !roster || !scores) return null
  const pending = roster.filter((p) => p.id !== playerId && !scores.has(p.id)).length
  return pending > 0 ? { pending, matchday } : null
}

export function useRatingsOpenToEveryone() {
  return useQuery({ queryKey: ['rating-settings'], queryFn: fetchRatingsOpenToEveryone })
}

export function useSetRatingsOpenToEveryone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setRatingsOpenToEveryone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rating-settings'] })
      queryClient.invalidateQueries({ queryKey: ['rating-matchday'] })
    },
  })
}
