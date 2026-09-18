import { useQuery } from '@tanstack/react-query'
import {
  fetchAppearanceCount,
  fetchComparisons,
  fetchGoalsAndAssists,
  fetchMatchHistory,
  fetchMatchRatings,
  fetchMotmCount,
  fetchPlayer,
  fetchPlayerTags,
} from './api'

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchPlayer(playerId!),
    enabled: !!playerId,
  })
}

export function useMatchRatings(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-match-ratings', playerId],
    queryFn: () => fetchMatchRatings(playerId!),
    enabled: !!playerId,
  })
}

export function useMatchHistory(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-match-history', playerId],
    queryFn: () => fetchMatchHistory(playerId!),
    enabled: !!playerId,
  })
}

export function useCareerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-career-stats', playerId],
    queryFn: async () => {
      const [appearances, goalsAssists, motm] = await Promise.all([
        fetchAppearanceCount(playerId!),
        fetchGoalsAndAssists(playerId!),
        fetchMotmCount(playerId!),
      ])
      return { appearances, ...goalsAssists, motm }
    },
    enabled: !!playerId,
  })
}

export function usePlayerTags(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-tags', playerId],
    queryFn: () => fetchPlayerTags(playerId!),
    enabled: !!playerId,
  })
}

export function useComparisons(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-comparisons', playerId],
    queryFn: () => fetchComparisons(playerId!),
    enabled: !!playerId,
  })
}
