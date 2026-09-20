import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database'
import {
  claimMonthlySlot,
  claimWeeklySpot,
  createMatchday,
  fetchActivePlayers,
  fetchAvailability,
  fetchDrawnTeams,
  fetchLastCompleteMatchday,
  fetchMatchResults,
  fetchMonthlyMembers,
  fetchNextMatchday,
  fetchStandbyEntries,
  fetchWeeklyClaims,
  fetchWeeklySpotsRemaining,
  joinStandby,
  leaveStandby,
  setAvailability,
  updateMatchdayCapacity,
  withdrawWeeklyClaim,
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
      queryClient.invalidateQueries({ queryKey: ['weekly-spots-remaining', matchdayId] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-members', month] })
      queryClient.invalidateQueries({ queryKey: ['weekly-spots-remaining'] })
    },
  })
}

export function useCreateMatchday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMatchday,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] }),
  })
}

export function useUpdateMatchdayCapacity(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (capacity: 30 | 36) => updateMatchdayCapacity(matchdayId!, capacity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchday', 'next'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-spots-remaining', matchdayId] })
    },
  })
}

export function useWeeklyClaims(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-claims', matchdayId],
    queryFn: () => fetchWeeklyClaims(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useWeeklySpotsRemaining(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-spots-remaining', matchdayId],
    queryFn: () => fetchWeeklySpotsRemaining(matchdayId!),
    enabled: !!matchdayId,
  })
}

function useInvalidateWeeklySignup(matchdayId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['weekly-claims', matchdayId] })
    queryClient.invalidateQueries({ queryKey: ['standby-entries', matchdayId] })
    queryClient.invalidateQueries({ queryKey: ['weekly-spots-remaining', matchdayId] })
  }
}

export function useClaimWeeklySpot(matchdayId: string | undefined) {
  const invalidate = useInvalidateWeeklySignup(matchdayId)
  return useMutation({
    mutationFn: (playerId: string) => claimWeeklySpot(matchdayId!, playerId),
    onSuccess: invalidate,
  })
}

export function useWithdrawWeeklyClaim(matchdayId: string | undefined) {
  const invalidate = useInvalidateWeeklySignup(matchdayId)
  return useMutation({
    mutationFn: (playerId: string) => withdrawWeeklyClaim(matchdayId!, playerId),
    onSuccess: invalidate,
  })
}

export function useStandbyEntries(matchdayId: string | undefined) {
  return useQuery({
    queryKey: ['standby-entries', matchdayId],
    queryFn: () => fetchStandbyEntries(matchdayId!),
    enabled: !!matchdayId,
  })
}

export function useJoinStandby(matchdayId: string | undefined) {
  const invalidate = useInvalidateWeeklySignup(matchdayId)
  return useMutation({
    mutationFn: (playerId: string) => joinStandby(matchdayId!, playerId),
    onSuccess: invalidate,
  })
}

export function useLeaveStandby(matchdayId: string | undefined) {
  const invalidate = useInvalidateWeeklySignup(matchdayId)
  return useMutation({
    mutationFn: (playerId: string) => leaveStandby(matchdayId!, playerId),
    onSuccess: invalidate,
  })
}
