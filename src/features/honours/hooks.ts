import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Mentionable } from '@/features/community/mentions/tokens'
import {
  deleteHonoursPost,
  fetchClubMoments,
  fetchClubTotals,
  fetchCupQuarters,
  fetchHonoursPosts,
  saveHonoursPost,
  setHonoursPin,
  setReaction,
  type HonoursPost,
  type ReactionKey,
} from './api'

const POSTS = 'honours-posts'

export function useHonoursPosts(playerId: string | null) {
  return useQuery({ queryKey: [POSTS, playerId], queryFn: () => fetchHonoursPosts(playerId) })
}

export function useClubTotals() {
  return useQuery({ queryKey: ['club-totals'], queryFn: fetchClubTotals, staleTime: 5 * 60 * 1000 })
}

export function useClubMoments() {
  return useQuery({ queryKey: ['club-moments'], queryFn: fetchClubMoments, staleTime: 5 * 60 * 1000 })
}

export function useCupQuarters() {
  return useQuery({ queryKey: ['cup-quarters-map'], queryFn: fetchCupQuarters, staleTime: 30 * 60 * 1000 })
}

export function useSaveHonoursPost(authorId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id?: string; title: string; text: string; picked: Mentionable[] }) => saveHonoursPost({ ...v, authorId: authorId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POSTS] }),
  })
}

export function useDeleteHonoursPost() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteHonoursPost, onSuccess: () => qc.invalidateQueries({ queryKey: [POSTS] }) })
}

export function useSetHonoursPin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => setHonoursPin(id, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: [POSTS] }),
  })
}

/** Optimistic, so tapping a reaction feels instant. */
export function useToggleReaction(playerId: string | null) {
  const qc = useQueryClient()
  const key = [POSTS, playerId]
  return useMutation({
    mutationFn: ({ postId, reaction, on }: { postId: string; reaction: ReactionKey; on: boolean }) =>
      setReaction(postId, playerId!, reaction, on),
    onMutate: async ({ postId, reaction, on }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<HonoursPost[]>(key)
      qc.setQueryData<HonoursPost[]>(key, (posts) =>
        posts?.map((p) => {
          if (p.id !== postId) return p
          const existing = p.reactions.find((r) => r.key === reaction)
          const reactions = existing
            ? p.reactions.map((r) => (r.key === reaction ? { ...r, count: r.count + (on ? 1 : -1), mine: on } : r))
            : [...p.reactions, { key: reaction, count: 1, mine: true }]
          return { ...p, reactions: reactions.filter((r) => r.count > 0) }
        }),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
