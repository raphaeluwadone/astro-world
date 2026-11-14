import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAdminPayments,
  fetchMyPayments,
  fetchPaymentReceipt,
  fetchSlotRoster,
  fetchPrices,
  markRefunded,
  setPrice,
  startPayment,
  verifyPayment,
  type PaymentTarget,
  type PriceKind,
} from './api'

export function usePrices() {
  return useQuery({ queryKey: ['payment-prices'], queryFn: fetchPrices })
}

export function useMyPayments(playerId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'mine', playerId],
    queryFn: () => fetchMyPayments(playerId!),
    enabled: !!playerId,
  })
}

export function useStartPayment() {
  return useMutation({
    mutationFn: (target: PaymentTarget) => startPayment(target),
    onError: (e) => toast.error(e.message),
  })
}

export function useVerifyPayment(reference: string | undefined, playerId: string | undefined) {
  return useQuery({
    queryKey: ['payment-verify', reference, playerId],
    queryFn: () => verifyPayment(reference!),
    enabled: !!reference && !!playerId,
    retry: 1,
    // Paystack can take a moment to mark a charge successful.
    refetchInterval: (q) => (q.state.data?.status === 'pending' && q.state.dataUpdateCount < 6 ? 3000 : false),
  })
}

export function usePaymentReceipt(reference: string | undefined, playerId: string | undefined, status: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'receipt', reference, playerId, status],
    queryFn: () => fetchPaymentReceipt(reference!, playerId!),
    enabled: !!reference && !!playerId && !!status,
  })
}

export function useSetPrice(updatedBy: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, amount }: { kind: PriceKind; amount: number }) => setPrice(kind, amount, updatedBy!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-prices'] }),
  })
}

export function useAdminPayments() {
  return useQuery({ queryKey: ['payments', 'admin'], queryFn: fetchAdminPayments })
}

export function useSlotRoster(matchdayId: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'roster', matchdayId, month],
    queryFn: () => fetchSlotRoster(matchdayId!, month!),
    enabled: !!matchdayId && !!month,
  })
}

export function useMarkRefunded() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markRefunded,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
    onError: (e) => toast.error(e.message),
  })
}
