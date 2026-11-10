import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPhotoState, fetchPlayerPhotos, removePlayerPhoto, savePlayerPhoto, type PhotoState } from './api'
import type { CroppedPhoto } from './PhotoCropDialog'

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

export function usePhotoState(playerId: string) {
  return useQuery({ queryKey: ['player-photo-state', playerId], queryFn: () => fetchPhotoState(playerId) })
}

export function useSavePlayerPhoto(playerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { photo: CroppedPhoto; previous: PhotoState }) => savePlayerPhoto(playerId, v.photo, v.previous),
    onSuccess: () => refresh(qc),
  })
}

export function useRemovePlayerPhoto(playerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (previous: PhotoState) => removePlayerPhoto(playerId, previous),
    onSuccess: () => refresh(qc),
  })
}
