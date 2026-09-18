import { useQuery } from '@tanstack/react-query'
import {
  fetchGoals,
  fetchLineups,
  fetchMatch,
  fetchMotmWinner,
  fetchRatingsIntegrity,
} from './api'

export function useMatch(matchId: string) {
  return useQuery({ queryKey: ['match', matchId], queryFn: () => fetchMatch(matchId) })
}

export function useLineups(matchId: string) {
  return useQuery({ queryKey: ['match-lineups', matchId], queryFn: () => fetchLineups(matchId) })
}

export function useGoals(matchId: string) {
  return useQuery({ queryKey: ['match-goals', matchId], queryFn: () => fetchGoals(matchId) })
}

export function useRatingsIntegrity(matchId: string) {
  return useQuery({
    queryKey: ['match-ratings-integrity', matchId],
    queryFn: () => fetchRatingsIntegrity(matchId),
  })
}

export function useMotmWinner(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['motm-winner', matchdayId],
    queryFn: () => fetchMotmWinner(matchdayId!),
    enabled: !!matchdayId,
  })
}
