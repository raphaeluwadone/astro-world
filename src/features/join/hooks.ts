import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createNewPlayer,
  fetchMyLatestClaim,
  fetchUnclaimedPlayers,
  submitClaim,
  updatePlayerJoinDetails,
  type JoinDetails,
} from './api'

export function useUnclaimedPlayers() {
  return useQuery({ queryKey: ['unclaimed-players'], queryFn: fetchUnclaimedPlayers })
}

export function useSubmitClaim() {
  return useMutation({
    mutationFn: ({ playerId, userId, details }: { playerId: string; userId: string; details: JoinDetails }) =>
      submitClaim(playerId, userId, details),
  })
}

export function useCreateNewPlayer() {
  return useMutation({
    mutationFn: ({ userId, nickname, fullName }: { userId: string; nickname: string; fullName: string }) =>
      createNewPlayer(userId, nickname, fullName),
  })
}

export function useUpdatePlayerJoinDetails() {
  return useMutation({
    mutationFn: ({ playerId, fields }: { playerId: string; fields: JoinDetails }) =>
      updatePlayerJoinDetails(playerId, fields),
  })
}

export function useMyLatestClaim(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-latest-claim', userId],
    queryFn: () => fetchMyLatestClaim(userId!),
    enabled: !!userId,
  })
}
