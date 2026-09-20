import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database'
import {
  castVote,
  createComparison,
  fetchAppearanceCount,
  fetchComparisons,
  fetchCooldowns,
  fetchGoalsAndAssists,
  fetchLastDropped,
  fetchMatchHistory,
  fetchMatchRatings,
  fetchMotmCount,
  fetchPlayer,
  fetchPlayerAwards,
  fetchPlayerTags,
  refreshProPlayerStats,
  removeComparison,
  searchProPlayers,
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

export function usePlayerAwards(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player-awards', playerId],
    queryFn: () => fetchPlayerAwards(playerId!),
    enabled: !!playerId,
  })
}

export function useComparisons(playerId: string | undefined, viewerId: string | undefined) {
  return useQuery({
    queryKey: ['player-comparisons', playerId, viewerId],
    queryFn: () => fetchComparisons(playerId!, viewerId),
    enabled: !!playerId,
  })
}

export function useLastDropped(playerId: string | undefined, source: Database['public']['Enums']['comparison_source']) {
  return useQuery({
    queryKey: ['comparison-last-dropped', playerId, source],
    queryFn: () => fetchLastDropped(playerId!, source),
    enabled: !!playerId,
  })
}

export function useCooldowns(playerId: string | undefined, source: Database['public']['Enums']['comparison_source']) {
  return useQuery({
    queryKey: ['comparison-cooldowns', playerId, source],
    queryFn: () => fetchCooldowns(playerId!, source),
    enabled: !!playerId,
  })
}

export function useSearchProPlayers(query: string) {
  return useQuery({
    queryKey: ['pro-players-search', query],
    queryFn: () => searchProPlayers(query),
    enabled: query.trim().length >= 2,
  })
}

export function useRefreshProPlayerStats() {
  return useMutation({
    mutationFn: (proPlayerId: string) => refreshProPlayerStats(proPlayerId),
  })
}

export function useCreateComparison(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      proPlayerId: string
      source: Database['public']['Enums']['comparison_source']
      createdBy: string
    }) => createComparison({ playerId: playerId!, ...params }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-comparisons', playerId] }),
  })
}

export function useRemoveComparison(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comparisonId: string) => removeComparison(comparisonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player-comparisons', playerId] }),
  })
}

export function useCastVote(playerId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { comparisonId: string; voterId: string; direction: 'up' | 'down' | null }) =>
      castVote(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-comparisons', playerId] })
      // A vote can be the one that trips the -15 drop trigger, so the
      // empty slot's "who got voted off" copy needs a refetch too.
      queryClient.invalidateQueries({ queryKey: ['comparison-last-dropped', playerId] })
    },
  })
}
