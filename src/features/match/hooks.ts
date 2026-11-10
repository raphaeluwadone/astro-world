import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  fetchGoals,
  fetchGoalsForMatches,
  type GoalRow,
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

/** Goals for several matches at once, grouped by match id. */
export function useGoalsByMatch(matchIds: string[]) {
  const ids = [...matchIds].sort()
  const { data } = useQuery({
    queryKey: ['match-goals-many', ids],
    queryFn: () => fetchGoalsForMatches(ids),
    enabled: ids.length > 0,
  })
  return useMemo(() => {
    const map = new Map<string, GoalRow[]>()
    for (const g of data ?? []) map.set(g.match_id, [...(map.get(g.match_id) ?? []), g])
    return map
  }, [data])
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
