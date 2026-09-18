import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database'
import {
  claimMonthlySlot,
  fetchActivePlayers,
  fetchAvailability,
  fetchBallotEntries,
  fetchDrawnTeams,
  fetchLastCompleteMatchday,
  fetchMatchResults,
  fetchMonthlyMembers,
  fetchNextMatchday,
  runBallotSelection,
  setAvailability,
  updateMatchdayCapacity,
} from './api'

type AvailabilityStatus = Database['public']['Enums']['availability_status']

export function useNextMatchday() {
  return useQuery({ queryKey: ['matchday', 'next'], queryFn: fetchNextMatchday })
}

export function useLastCompleteMatchday() {
  return useQuery({ queryKey: ['matchday', 'last-complete'], queryFn: fetchLastCompleteMatchday })
}

export function useActivePlayers() {
  return useQuery({ queryKey: ['players', 'active'], queryFn: fetchActivePlayers })
}

export function useAvailability(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['availability', matchdayId],
    queryFn: () => fetchAvailability(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useBallotEntries(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['ballot-entries', matchdayId],
    queryFn: () => fetchBallotEntries(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useDrawnTeams(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['drawn-teams', matchdayId],
    queryFn: () => fetchDrawnTeams(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useMatchResults(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['match-results', matchdayId],
    queryFn: () => fetchMatchResults(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useSetAvailability(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ playerId, status }: { playerId: string; status: AvailabilityStatus }) =>
      setAvailability(matchdayId!, playerId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', matchdayId] })
    },
  })
}

export function useMonthlyMembers(month: string | undefined) {
  return useQuery({
    queryKey: ['monthly-members', month],
    queryFn: () => fetchMonthlyMembers(month!),
    enabled: !!month,
  })
}

export function useClaimMonthlySlot(month: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (playerId: string) => claimMonthlySlot(playerId, month!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monthly-members', month] }),
  })
}

export function useUpdateMatchdayCapacity(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (capacity: 30 | 36) => updateMatchdayCapacity(matchdayId!, capacity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] }),
  })
}

export function useRunBallotSelection(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runBallotSelection(matchdayId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] })
      queryClient.invalidateQueries({ queryKey: ['ballot-entries', matchdayId] })
    },
  })
}
