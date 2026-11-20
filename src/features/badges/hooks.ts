import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { awardBadges, awardManualBadge, buildBadges, decideBadge, fetchBadgeRows, type BadgeStatus } from './api'

export function useBadgeRows() {
  return useQuery({ queryKey: ['badges'], queryFn: fetchBadgeRows, staleTime: 5 * 60 * 1000 })
}

/** Every player's visible badges, keyed by player id. One query serves the whole app. */
export function useBadgesByPlayer() {
  const { data } = useBadgeRows()
  return useMemo(() => buildBadges(data ?? []), [data])
}

export function usePlayerBadges(playerId: string | undefined) {
  const map = useBadgesByPlayer()
  return playerId ? (map.get(playerId) ?? []) : []
}

export function useAwardBadges() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (year?: number) => awardBadges(year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  })
}

export function useDecideBadge(deciderId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BadgeStatus }) => decideBadge(id, status, deciderId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  })
}

export function useAwardManualBadge(deciderId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { playerId: string; badgeKey: string; period: { key: string; at?: string }; detail?: string }) =>
      awardManualBadge(v.playerId, v.badgeKey, v.period, deciderId!, v.detail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  })
}
