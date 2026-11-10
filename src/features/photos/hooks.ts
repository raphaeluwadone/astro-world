import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPlayerPhotos, removePlayerPhoto, uploadPlayerPhoto } from './api'

export function usePlayerPhotos() {
  return useQuery({ queryKey: ['player-photos'], queryFn: fetchPlayerPhotos, staleTime: 5 * 60 * 1000 })
}

/** A single player's photo url, from the shared map. */
export function usePlayerPhoto(playerId: string | null | undefined) {
  const { data } = usePlayerPhotos()
  return playerId ? (data?.get(playerId) ?? null) : null
}

// A photo shows up in many places (profile, cards, badges), so refresh anything that reads players.
const refresh = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries()

export function useUploadPlayerPhoto(playerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { blob: Blob; previousUrl: string | null }) => uploadPlayerPhoto(playerId, v.blob, v.previousUrl),
    onSuccess: () => refresh(qc),
  })
}

export function useRemovePlayerPhoto(playerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (currentUrl: string | null) => removePlayerPhoto(playerId, currentUrl),
    onSuccess: () => refresh(qc),
  })
}
