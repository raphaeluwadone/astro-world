import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDuesQuarter,
  fetchAllPlayers,
  fetchCauseContributors,
  fetchCauseRaised,
  fetchCauses,
  fetchCurrentDuesQuarter,
  fetchDuesPaidCount,
  fetchDuesPayments,
  fetchPastDuesQuarters,
  markDuesPaid,
  openCause,
  recordContribution,
  setCauseStatus,
  suggestCause,
  unmarkDuesPaid,
  type CauseStatus,
  type NewDuesQuarterFields,
} from './api'

export function useAllPlayers() {
  return useQuery({ queryKey: ['players', 'all'], queryFn: fetchAllPlayers })
}

export function useCurrentDuesQuarter() {
  return useQuery({ queryKey: ['dues-quarter', 'current'], queryFn: fetchCurrentDuesQuarter })
}

export function usePastDuesQuarters() {
  return useQuery({ queryKey: ['dues-quarter', 'past'], queryFn: fetchPastDuesQuarters })
}

export function useDuesPayments(duesQuarterId: string | undefined) {
  return useQuery({
    queryKey: ['dues-payments', duesQuarterId],
    queryFn: () => fetchDuesPayments(duesQuarterId!),
    enabled: !!duesQuarterId,
  })
}

export function useDuesPaidCount(duesQuarterId: string | undefined) {
  return useQuery({
    queryKey: ['dues-paid-count', duesQuarterId],
    queryFn: () => fetchDuesPaidCount(duesQuarterId!),
    enabled: !!duesQuarterId,
  })
}

export function useCreateDuesQuarter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fields: NewDuesQuarterFields) => createDuesQuarter(fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dues-quarter'] }),
  })
}

function useInvalidateDues(duesQuarterId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['dues-payments', duesQuarterId] })
    queryClient.invalidateQueries({ queryKey: ['dues-paid-count', duesQuarterId] })
  }
}

export function useMarkDuesPaid(duesQuarterId: string | undefined) {
  const invalidate = useInvalidateDues(duesQuarterId)
  return useMutation({
    mutationFn: (params: { playerId: string; markedBy: string }) =>
      markDuesPaid(duesQuarterId!, params.playerId, params.markedBy),
    onSuccess: invalidate,
  })
}

export function useUnmarkDuesPaid(duesQuarterId: string | undefined) {
  const invalidate = useInvalidateDues(duesQuarterId)
  return useMutation({
    mutationFn: (playerId: string) => unmarkDuesPaid(duesQuarterId!, playerId),
    onSuccess: invalidate,
  })
}

export function useCauses() {
  return useQuery({ queryKey: ['causes'], queryFn: fetchCauses })
}

export function useCauseRaised(causeId: string | undefined) {
  return useQuery({
    queryKey: ['cause-raised', causeId],
    queryFn: () => fetchCauseRaised(causeId!),
    enabled: !!causeId,
  })
}

export function useCauseContributors(causeId: string | undefined) {
  return useQuery({
    queryKey: ['cause-contributors', causeId],
    queryFn: () => fetchCauseContributors(causeId!),
    enabled: !!causeId,
  })
}

export function useSuggestCause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { title: string; description: string; suggestedBy: string }) =>
      suggestCause(params.title, params.description, params.suggestedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['causes'] }),
  })
}

export function useOpenCause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { causeId: string; targetAmount: number; deadline: string }) =>
      openCause(params.causeId, params.targetAmount, params.deadline),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['causes'] }),
  })
}

export function useSetCauseStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { causeId: string; status: CauseStatus }) => setCauseStatus(params.causeId, params.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['causes'] }),
  })
}

export function useRecordContribution(causeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { playerId: string; amount: number; markedBy: string }) =>
      recordContribution(causeId!, params.playerId, params.amount, params.markedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cause-raised', causeId] })
      queryClient.invalidateQueries({ queryKey: ['cause-contributors', causeId] })
    },
  })
}
