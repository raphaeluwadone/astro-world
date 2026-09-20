import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPlayerToSquad,
  createCupMatch,
  createCupQuarter,
  deleteCupMatch,
  fetchCupWinner,
  fetchCurrentCup,
  fetchEntrants,
  fetchMatches,
  fetchPastCups,
  fetchSquads,
  joinCup,
  leaveCup,
  recordCupMatchScore,
  removePlayerFromSquad,
  renameSquad,
  runCupDraw,
  updateCupStatus,
  type CupStatus,
  type NewCupMatchFields,
  type NewCupQuarterFields,
} from './api'

export function useCurrentCup() {
  return useQuery({ queryKey: ['cup-current'], queryFn: fetchCurrentCup })
}

export function usePastCups() {
  return useQuery({ queryKey: ['cup-past'], queryFn: fetchPastCups })
}

export function useCupHonours() {
  return useQuery({
    queryKey: ['cup-honours'],
    queryFn: async () => {
      const quarters = await fetchPastCups()
      return Promise.all(quarters.map(fetchCupWinner))
    },
  })
}

export function useCupEntrants(cupQuarterId: string | undefined) {
  return useQuery({
    queryKey: ['cup-entrants', cupQuarterId],
    queryFn: () => fetchEntrants(cupQuarterId!),
    enabled: !!cupQuarterId,
  })
}

export function useCupSquads(cupQuarterId: string | undefined) {
  return useQuery({
    queryKey: ['cup-squads', cupQuarterId],
    queryFn: () => fetchSquads(cupQuarterId!),
    enabled: !!cupQuarterId,
  })
}

export function useCupMatches(cupQuarterId: string | undefined) {
  return useQuery({
    queryKey: ['cup-matches', cupQuarterId],
    queryFn: () => fetchMatches(cupQuarterId!),
    enabled: !!cupQuarterId,
  })
}

function useInvalidateCup(cupQuarterId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['cup-current'] })
    queryClient.invalidateQueries({ queryKey: ['cup-past'] })
    queryClient.invalidateQueries({ queryKey: ['cup-entrants', cupQuarterId] })
    queryClient.invalidateQueries({ queryKey: ['cup-squads', cupQuarterId] })
    queryClient.invalidateQueries({ queryKey: ['cup-matches', cupQuarterId] })
  }
}

export function useJoinCup(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (playerId: string) => joinCup(cupQuarterId!, playerId),
    onSuccess: invalidate,
  })
}

export function useLeaveCup(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (entrantId: string) => leaveCup(entrantId),
    onSuccess: invalidate,
  })
}

export function useCreateCupQuarter() {
  const invalidate = useInvalidateCup(undefined)
  return useMutation({
    mutationFn: (fields: NewCupQuarterFields) => createCupQuarter(fields),
    onSuccess: invalidate,
  })
}

export function useUpdateCupStatus(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (status: CupStatus) => updateCupStatus(cupQuarterId!, status),
    onSuccess: invalidate,
  })
}

export function useRunCupDraw(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: () => runCupDraw(cupQuarterId!),
    onSuccess: invalidate,
  })
}

export function useRenameSquad(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (params: { squadId: string; name: string }) => renameSquad(params.squadId, params.name),
    onSuccess: invalidate,
  })
}

export function useAddPlayerToSquad(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (params: { squadId: string; playerId: string }) => addPlayerToSquad(params.squadId, params.playerId),
    onSuccess: invalidate,
  })
}

export function useRemovePlayerFromSquad(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (params: { squadId: string; playerId: string }) => removePlayerFromSquad(params.squadId, params.playerId),
    onSuccess: invalidate,
  })
}

export function useCreateCupMatch(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (fields: NewCupMatchFields) => createCupMatch(fields),
    onSuccess: invalidate,
  })
}

export function useRecordCupMatchScore(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (params: { matchId: string; scoreA: number; scoreB: number }) =>
      recordCupMatchScore(params.matchId, params.scoreA, params.scoreB),
    onSuccess: invalidate,
  })
}

export function useDeleteCupMatch(cupQuarterId: string | undefined) {
  const invalidate = useInvalidateCup(cupQuarterId)
  return useMutation({
    mutationFn: (matchId: string) => deleteCupMatch(matchId),
    onSuccess: invalidate,
  })
}
