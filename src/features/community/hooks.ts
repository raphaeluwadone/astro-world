import type { Mentionable } from './mentions/tokens'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPost,
  createReply,
  deleteReply,
  fetchFeed,
  fetchMentionables,
  fetchPost,
  fetchMostMentioned,
  fetchReplies,
  fetchPendingTraits,
  fetchPlayerTraitVotes,
  fetchTagPool,
  inventTrait,
  setPlayerTraitVote,
  setTraitVote,
  setDisliked,
  setLiked,
} from './api'

export function useFeed(currentPlayerId: string | null) {
  return useQuery({
    queryKey: ['community-feed', currentPlayerId],
    queryFn: () => fetchFeed(currentPlayerId),
  })
}

export function useLinkedPost(postId: string | undefined, currentPlayerId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['community-post', postId, currentPlayerId],
    queryFn: () => fetchPost(postId!, currentPlayerId),
    enabled: !!postId && enabled,
  })
}

export function useMostMentioned() {
  return useQuery({ queryKey: ['community-most-mentioned'], queryFn: fetchMostMentioned })
}

export function useTagPool() {
  return useQuery({ queryKey: ['community-tag-pool'], queryFn: fetchTagPool })
}

export function useCreatePost(authorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ text }: { text: string; mentions?: Mentionable[] }) => createPost(authorId!, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['community-most-mentioned'] })
    },
  })
}

export function useToggleLike(currentPlayerId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      setLiked(postId, currentPlayerId!, liked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['community-post'] })
    },
  })
}

export function useToggleDislike(currentPlayerId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, disliked }: { postId: string; disliked: boolean }) => setDisliked(postId, currentPlayerId!, disliked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['community-post'] })
    },
  })
}

export function useReplies(postId: string, enabled: boolean) {
  return useQuery({ queryKey: ['community-replies', postId], queryFn: () => fetchReplies(postId), enabled })
}

export function useCreateReply(postId: string, authorId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createReply(postId, authorId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', postId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
      queryClient.invalidateQueries({ queryKey: ['community-post'] })
    },
  })
}

export function useDeleteReply(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (replyId: string) => deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-replies', postId] })
      queryClient.invalidateQueries({ queryKey: ['community-feed'] })
    },
  })
}

export function useMentionables() {
  return useQuery({ queryKey: ['community-mentionables'], queryFn: fetchMentionables, staleTime: 5 * 60 * 1000 })
}

function useInvalidateTraits() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['community-tag-pool'] })
    qc.invalidateQueries({ queryKey: ['pending-traits'] })
    qc.invalidateQueries({ queryKey: ['player-trait-votes'] })
    qc.invalidateQueries({ queryKey: ['player-cards'] })
    qc.invalidateQueries({ queryKey: ['player-tags'] })
    qc.invalidateQueries({ queryKey: ['community-mentionables'] })
  }
}

export function usePendingTraits(viewerId: string | null) {
  return useQuery({ queryKey: ['pending-traits', viewerId], queryFn: () => fetchPendingTraits(viewerId) })
}

export function useInventTrait(createdBy: string | null) {
  const invalidate = useInvalidateTraits()
  return useMutation({ mutationFn: (label: string) => inventTrait(label, createdBy!), onSuccess: invalidate })
}

export function useTraitVote(voterId: string | null) {
  const invalidate = useInvalidateTraits()
  return useMutation({ mutationFn: ({ tagId, on }: { tagId: string; on: boolean }) => setTraitVote(tagId, voterId!, on), onSuccess: invalidate })
}

export function usePlayerTraitVotes(playerId: string | undefined, viewerId: string | null) {
  return useQuery({
    queryKey: ['player-trait-votes', playerId, viewerId],
    queryFn: () => fetchPlayerTraitVotes(playerId!, viewerId),
    enabled: !!playerId,
  })
}

export function usePlayerTraitVote(voterId: string | null) {
  const invalidate = useInvalidateTraits()
  return useMutation({
    mutationFn: ({ playerId, tagId, on }: { playerId: string; tagId: string; on: boolean }) => setPlayerTraitVote(playerId, tagId, voterId!, on),
    onSuccess: invalidate,
  })
}
