import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, fetchFeed, fetchMostMentioned, fetchTagPool, setLiked } from './api'

export function useFeed(currentPlayerId: string | null) {
  return useQuery({
    queryKey: ['community-feed', currentPlayerId],
    queryFn: () => fetchFeed(currentPlayerId),
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
    mutationFn: (content: string) => createPost(authorId!, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}

export function useToggleLike(currentPlayerId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      setLiked(postId, currentPlayerId!, liked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-feed'] }),
  })
}
