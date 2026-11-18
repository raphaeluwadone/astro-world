import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { grantWriter, revokeWriter } from '@/features/articles/api'
import { createMember, fetchMembers, fetchStuckAccounts, linkAccount, setAdmin, setLeft, updateMember, type MemberPatch } from './api'

export function useMembers() {
  return useQuery({ queryKey: ['admin-members'], queryFn: fetchMembers })
}

function useInvalidateMembers() {
  const qc = useQueryClient()
  return () => {
    for (const key of ['admin-members', 'player-cards', 'players', 'community-mentionables', 'article-writers', 'can-write-articles', 'player']) {
      qc.invalidateQueries({ queryKey: [key] })
    }
  }
}

export function useUpdateMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({ mutationFn: ({ id, patch }: { id: string; patch: MemberPatch }) => updateMember(id, patch), onSuccess: invalidate })
}

export function useSetRole() {
  const { player } = useCurrentPlayer()
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: ({ id, role, on }: { id: string; role: 'admin' | 'writer' | 'left'; on: boolean }) =>
      role === 'admin' ? setAdmin(id, on) : role === 'writer' ? (on ? grantWriter(id, player!.id) : revokeWriter(id)) : setLeft(id, on, player!.id),
    onSuccess: invalidate,
  })
}

export function useCreateMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: ({ nickname, fullName, positions }: { nickname: string; fullName: string; positions: Parameters<typeof createMember>[2] }) =>
      createMember(nickname, fullName, positions),
    onSuccess: invalidate,
  })
}

export function useStuckAccounts() {
  return useQuery({ queryKey: ['admin-stuck-accounts'], queryFn: fetchStuckAccounts })
}

export function useLinkAccount() {
  const invalidate = useInvalidateMembers()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, playerId }: { userId: string; playerId: string }) => linkAccount(userId, playerId),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['admin-stuck-accounts'] })
    },
  })
}
