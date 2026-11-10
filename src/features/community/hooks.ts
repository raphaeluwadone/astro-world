import type { Mentionable } from './mentions/tokens'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, fetchFeed, fetchMentionables, fetchPost, fetchMostMentioned, fetchTagPool, setLiked } from './api'

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
    mutationFn: ({ text, mentions }: { text: string; mentions: Mentionable[] }) => createPost(authorId!, text, mentions),
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

export function useMentionables() {
  return useQuery({ queryKey: ['community-mentionables'], queryFn: fetchMentionables, staleTime: 5 * 60 * 1000 })
}
